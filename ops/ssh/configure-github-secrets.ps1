#requires -Version 7.0
<#
  Local workstation only. Makes a separate repository-scoped deploy key,
  configures existing GitHub Actions secret names and never prints a private key.
  Host public key MUST be copied independently from the VPS provider console.
  Requires: Windows OpenSSH, gh CLI authenticated as repository owner.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('gardvpn','myosa','osgardos','newworld')]
    [string]$Project,
    [Parameter(Mandatory=$true)]
    [string]$ServerHost,
    [Parameter(Mandatory=$true)]
    [string]$DeployUser,
    [Parameter(Mandatory=$true)]
    [string]$HostEd25519PublicKey,
    [string]$GardWebRoot = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($ServerHost -notmatch '^[A-Za-z0-9.-]+$') { throw 'ServerHost must be a verified DNS name or IPv4 address, no port or shell characters.' }
if ($DeployUser -notmatch '^[a-z_][a-z0-9_-]*$') { throw 'DeployUser is not a valid server account.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI: winget install --id GitHub.cli -e; then gh auth login.' }
if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) { throw 'Windows OpenSSH ssh-keygen must be installed.' }
$map = @{
    gardvpn = @{
        Repo='HADJAL001/osgard-new-world'; Environment='gardvpn-production'
        Host='GARDVPN_DEPLOY_HOST'; User='GARDVPN_DEPLOY_USER'
        Key='GARDVPN_DEPLOY_SSH_KEY_B64'; Known='GARDVPN_DEPLOY_KNOWN_HOSTS'
    }
    myosa = @{
        Repo='HADJAL001/osa'; Environment='osa-production'
        Host='OSA_VPS_HOST'; User='OSA_VPS_USER'
        Key='OSA_VPS_SSH_KEY_B64'; Known='OSA_VPS_KNOWN_HOSTS'
    }
    osgardos = @{
        Repo='HADJAL001/osgardos'; Environment='osgardos-production'
        Host='OSGARDOS_DEPLOY_HOST'; User='OSGARDOS_DEPLOY_USER'
        Key='OSGARDOS_DEPLOY_KEY_B64'; Known='OSGARDOS_KNOWN_HOSTS'
    }
    newworld = @{
        Repo='HADJAL001/asgard-redesign'; Environment='osgardnewworld-production'
        Host='NEWWORLD_DEPLOY_HOST'; User='NEWWORLD_DEPLOY_USER'
        Key='NEWWORLD_DEPLOY_KEY_B64'; Known='NEWWORLD_DEPLOY_KNOWN_HOSTS'
    }
}
$cfg = $map[$Project]
if ($Project -eq 'gardvpn' -and $GardWebRoot -notmatch '^/(srv|opt|var/www)/[A-Za-z0-9_./-]+$') {
    throw 'Supply -GardWebRoot only AFTER confirming the true managed static release root on VPS (for example /srv/gardvpn-site).'
}
if ($GardWebRoot.Contains('..')) { throw 'Unsafe webroot path.' }
$hostParts = @($HostEd25519PublicKey.Trim() -split '\s+')
if ($hostParts.Count -lt 2 -or $hostParts[0] -ne 'ssh-ed25519' -or $hostParts[1] -notmatch '^[A-Za-z0-9+/]+={0,2}$') {
    throw 'HostEd25519PublicKey must be the PUBLIC content of /etc/ssh/ssh_host_ed25519_key.pub from VPS console.'
}
$null = [Convert]::FromBase64String($hostParts[1])
$fingerprint = 'SHA256:' + [Convert]::ToBase64String(
    [System.Security.Cryptography.SHA256]::HashData([Convert]::FromBase64String($hostParts[1]))
).TrimEnd('=')
Write-Host "Provider-console host fingerprint: $fingerprint"
Write-Host 'Compare this value against ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256 on the VPS console.' -ForegroundColor Yellow
$confirmation = Read-Host 'Type CONFIRMED only if fingerprint matches your independently verified VPS console'
if ($confirmation -cne 'CONFIRMED') { throw 'Host identity was not independently confirmed. No GitHub secrets changed.' }
& gh auth status 2>$null
if ($LASTEXITCODE -ne 0) { throw 'Authenticate first with gh auth login, using the GitHub account that owns the repository.' }
$sshDir = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.ssh'
if (-not (Test-Path -LiteralPath $sshDir)) { New-Item -Type Directory -Path $sshDir | Out-Null }
$keyFile = Join-Path $sshDir ('osgard_' + $Project + '_github_ed25519')
if ((Test-Path -LiteralPath $keyFile) -xor (Test-Path -LiteralPath ($keyFile + '.pub'))) {
    throw 'Only one half of an existing key pair was found; inspect locally before proceeding.'
}
if (-not (Test-Path -LiteralPath $keyFile)) {
    & ssh-keygen -q -t ed25519 -a 100 -f $keyFile -N '' -C ("HADJAL001/" + $Project + "-actions")
    if ($LASTEXITCODE -ne 0) { throw 'ssh-keygen failed; no secrets configured.' }
}
Write-Host "Public deploy key path: $keyFile.pub"
Write-Host 'Install this PUBLIC .pub key into the chosen VPS account authorized_keys before triggering deployment.' -ForegroundColor Cyan
$repo = $cfg['Repo']
$environmentName = $cfg['Environment']
& gh api -X PUT ("repos/" + $repo + "/environments/" + $environmentName) --silent
if ($LASTEXITCODE -ne 0) {
    throw ('Cannot create/verify protected GitHub Environment ' + $environmentName + '. Create it in GitHub Settings > Environments and re-run.')
}
function Set-EnvironmentSecret {
    param([string]$SecretName,[string]$SecretValue)
    # STDIN only: NEVER log private keys or pass them in process command arguments.
    $SecretValue | & gh secret set $SecretName -R $repo --env $environmentName
    if ($LASTEXITCODE -ne 0) { throw ('Could not configure GitHub secret: ' + $SecretName) }
    Write-Host ('Configured secret: ' + $SecretName)
}
Set-EnvironmentSecret -SecretName $cfg['Host'] -SecretValue $ServerHost
Set-EnvironmentSecret -SecretName $cfg['User'] -SecretValue $DeployUser
$private64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($keyFile))
Set-EnvironmentSecret -SecretName $cfg['Key'] -SecretValue $private64
$private64 = $null
$known = $ServerHost + ' ssh-ed25519 ' + $hostParts[1]
Set-EnvironmentSecret -SecretName $cfg['Known'] -SecretValue $known
if ($Project -eq 'gardvpn') {
    Set-EnvironmentSecret -SecretName 'GARDVPN_DEPLOY_WEBROOT' -SecretValue $GardWebRoot
}
Write-Host ''
Write-Host ('READY: GitHub secrets configured for ' + $repo + ' / ' + $environmentName) -ForegroundColor Green
Write-Host 'Important: this does NOT install public key, migrate Nginx, verify a VPS login, or publish a site.'
Write-Host 'Only private key bytes on this computer were uploaded into encrypted GitHub Secrets; do not send that key in chat.'
