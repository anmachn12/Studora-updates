# Studora

A personal Windows learning workspace for Math, English, Physics, Biology, Chemistry, Arabic, Islamic Studies, and KSA Studies.

Download the Windows installer from [Releases](https://github.com/anmachn12/Studora-updates/releases/latest). Version 0.1.1 is the first version with in-app updates. If you have 0.1.0, run the new installer once, using the same installation location.

The download icon directly above Settings checks for a stable update. An available update adds a small green indicator. Choose **Download update**, then **Restart and install** when you are ready. Startup checks do not automatically download or install anything. Your local study data is kept separately from the installation.

## Development

Install Node.js 22 and Git. Clone this repository, run `npm ci`, then `npm start`. The development app shows an explanatory update panel; updates install only in a packaged app.

Run `npm test` for the study core and updater state tests. Run `node scripts/updater-ui-test.cjs` for the disposable native interface test. Its `--no-sandbox` switch belongs only to the test runner; the installed app keeps its browser sandbox enabled. Run `npm run build -- --publish never` to produce a Windows NSIS installer in `dist/`.

## Publish an update

1. Change the app and run the tests.
2. Run `npm version patch --no-git-tag-version` to update both package files; add the release notes to `CHANGELOG.md`.
3. Commit and push to `main`.

GitHub Actions tests the app, builds the installer, and publishes a stable release with the installer, blockmap, and `latest.yml` update metadata. Already published versions are immutable: bump the version for each new release. The workflow uses GitHub's temporary token; there is no personal GitHub token or OpenAI key in the app or repository.

If a release job stops after creating a draft, inspect that draft before retrying; delete the incomplete draft to allow a fresh build of the same version. Published releases are never replaced by the workflow. GitHub Actions must be enabled with the workflow's declared write permission. Windows signing has not been configured; installers are currently unsigned.

## Local data and AI

Chats, notes, settings, and imported materials stay in the Windows app-data folder for Studora. Open that folder from Settings. Avoid deleting it when upgrading. Your OpenAI API account is connected inside Settings; its key uses Windows secure storage when available, with a session-only fallback. Asking the tutor sends the chosen learning context to OpenAI. Nothing in your study workspace is uploaded to GitHub by the update feature.

PDF, Word, image, and text imports, lesson/example organization, interactive geometry, working-board drawings, source-based explanations, practice, exam planning, and bilingual Arabic tutoring are included. Video sources currently use pasted transcripts.

This repository is public and contains application code only. Never commit study files, API keys, workspace backups, or signing certificates.
