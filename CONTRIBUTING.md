# Contributing

`hibelleharmony.com` is served via GitHub Pages directly from the `main`
branch of this repository, with no build or CI step. Anything merged to
`main` is live on the site immediately, so all changes go through a
reviewed pull request.

## Branch naming

- **Claude Code**: `claude/<short-description>`
- **Codex**: `codex/<short-description>`
- Anyone else: any branch name other than `main`

## Workflow

1. Create a branch from the latest `main`.
2. Make your changes and commit.
3. Push the branch and open a pull request into `main`.
4. Get it reviewed and merged. Do not push directly to `main`.

## Repository-wide conventions

- Pages that use the `pageVersion` / `refresh` cache-busting pattern (see
  `index.html`) must fetch `version.json` and compare against it directly,
  the way `index.html` does. Do not add a second, independent redirect gate
  that requires the URL's `refresh` parameter to match a hardcoded page
  version — two competing redirect conditions can fight each other and
  cause an infinite reload loop (this happened in `community.html` and was
  fixed by aligning it with `index.html`'s pattern).
