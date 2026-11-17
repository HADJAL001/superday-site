#requires -Version 7.0
<#
  Set only the SSH host-public-key pin. DOES NOT rotate a working deploy key.
  The host key MUST come independently from the VPS provider console.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('gardvpn','myosa','osgardos','newworld')]
    [string]$Project,
    [Parameter(Mandatory=$true)]
    [string]$ServerHost,
    [Parameter(Mandatory=$true)]
    [string]$HostEd25519PublicKey
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($ServerHost -notmatch '^[A-Za-z0-9.-]+$') { throw 'Invalid verified hostname or IPv4. Current workflows use SSH port 22.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI and run gh auth login.' }
$map = @{
    gardvpn=@{Repo='HADJAL001/osgard-new-world';Env='gardvpn-production';Name='GARDVPN_DEPLOY_KNOWN_HOSTS'}
    myosa=@{Repo='HADJAL001/osa';Env='osa-production';Name='OSA_VPS_KNOWN_HOSTS'}
    osgardos=@{Repo='HADJAL001/osgardos';Env='osgardos-production';Name='OSGARDOS_KNOWN_HOSTS'}
    newworld=@{Repo='HADJAL001/asgard-redesign';Env='osgardnewworld-production';Name='NEWWORLD_DEPLOY_KNOWN_HOSTS'}
}
$cfg=$map[$Project]
$parts=@($HostEd25519PublicKey.Trim() -split '\s+')
if($parts.Count -lt 2 -or $parts[0] -ne 'ssh-ed25519' -or $parts[1] -notmatch '^[A-Za-z0-9+/]+={0,2}$') {
    throw 'Use PUBLIC /etc/ssh/ssh_host_ed25519_key.pub line copied directly from provider console.'
}
$keyBytes=[Convert]::FromBase64String($parts[1])
$fingerprint='SHA256:'+([Convert]::ToBase64String([System.Security.Cryptography.SHA256]::HashData($keyBytes)).TrimEnd('='))
Write-Host "Verify server public-key fingerprint: $fingerprint"
Write-Host 'On VPS provider console: sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256'
Write-Host 'IMPORTANT: ServerHost must be the same VPS configured in your existing GitHub DEPLOY_HOST secret. This utility cannot read it.'
if((Read-Host 'Type CONFIRMED if both SSH host and SHA256 fingerprint match provider console') -cne 'CONFIRMED') {
    throw 'Not independently verified; no GitHub secret changed.'
}
& gh auth status 2>$null
if($LASTEXITCODE -ne 0) { throw 'gh auth login required.' }
$hostEntry=$ServerHost+' ssh-ed25519 '+$parts[1]
$hostEntry | & gh secret set $cfg['Name'] --repo $cfg['Repo'] --env $cfg['Env']
if($LASTEXITCODE -ne 0) { throw 'Secret update rejected; check the GitHub environment or owner permission.' }
Write-Host ('PASS: '+$cfg['Name']+' configured for '+$cfg['Repo']+'/'+$cfg['Env']) -ForegroundColor Green
Write-Host 'No SSH private key, DEPLOY_HOST or DEPLOY_USER was read, changed, displayed or rotated.'
