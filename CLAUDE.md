# Working on this repository

This repository (`hibelle-harmonylink/harmony-link`) is the source for the
`hibelleharmony.com` static site, served via GitHub Pages directly from the
`main` branch. There is no CI/build step, so whatever lands on `main` goes
live immediately.

Claude Code and Codex both work in this repository. Follow these rules:

1. **Never push directly to `main`.** Always create a branch and open a pull
   request.
2. **Claude Code sessions use a `claude/...` branch name.** (Claude Code on
   the web already does this automatically for cloud sessions.)
3. **Codex sessions use a `codex/...` branch name.**
4. **Merge to `main` only through a reviewed pull request.** Since there is
   no automated test suite, treat PR review as the only safety check before
   changes go live.
5. Do not delete or reset other branches or history you did not create in
   the current session, and do not force-push.
