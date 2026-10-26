# OSGARD V19 — CI private source token trust boundary

The native-source auditor optionally reads three independently owned private repositories. A repository-scoped `GITHUB_TOKEN` cannot cross into them. The optional `OSGARD_SOURCE_READ_TOKEN` must only be provided to a GitHub Actions job running **reviewed code from `HADJAL001/superday-site` `refs/heads/main`**.

## New guarantees

- Untrusted PR jobs retain public-only GitHub read access and do not receive the cross-repo private token.
- An authorized `workflow_dispatch` on a feature branch will skip the inventory job **before checkout**; manually selecting an arbitrary branch no longer lets the runner consume a secret.
- The private token step additionally checks `github.ref == refs/heads/main`, the exact repository identity and that the event is not `pull_request`.
- The token remains optional. Missing permission yields `private_repo_read_access_not_configured`, not verified source.
- The suite contains four no-network regression tests, preserving V17/V18 checks.

The authorized operator must still scope the read-only credential to the three private repos and document rotation per [issue #19](https://github.com/HADJAL001/superday-site/issues/19). The code never creates, prints or rotates a secret.

**Not production authorization.** Public approved premium previews, native E2E, protected deploy cutovers and Forgejo SHA parity remain independent gates. This V19 change does not fix the blocked TCP port `64.177.120.183:2222`.
