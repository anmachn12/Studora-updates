# Studora

A personal Windows learning workspace for Math, English, Physics, Biology, Chemistry, Arabic, Islamic Studies, and KSA Studies.

Download the Windows installer from [Releases](https://github.com/anmachn12/Studora-updates/releases/latest). Version 0.1.1 is the first version with in-app updates. If you have 0.1.0, run the new installer once, using the same installation location.

The download icon directly above Settings checks for a stable update. An in-app notification announces new versions and opens a description of their changes. An available update adds a small green indicator. Choose **Install and restart** when you are ready. With background updates enabled, closing the window keeps Studora in the Windows tray; it downloads new releases there and also starts its updater at Windows sign-in. Checks run every 30 minutes. Installation waits for your click. Turn background updates off in Settings, or choose **Quit Studora** from the tray to stop the updater completely. Your local study data is kept separately from the installation.

## Development

Install Node.js 22 and Git. Clone this repository, run `npm ci`, then `npm start`. The development app shows an explanatory update panel; updates install only in a packaged app.

Run `npm test` for the study core and updater state tests. Run `node scripts/updater-ui-test.cjs` for the disposable native interface test. Its `--no-sandbox` switch belongs only to the test runner; the installed app keeps its browser sandbox enabled. Run `npm run build -- --publish never` to produce a Windows NSIS installer in `dist/`.

## Publish an update

1. Change the app and run the tests.
2. Run `npm version patch --no-git-tag-version` to update both package files; add the release notes to `CHANGELOG.md`.
3. Commit and push to `main`.

GitHub Actions tests the app, builds the installer, and publishes a stable release with the installer, blockmap, and `latest.yml` update metadata. Release descriptions are extracted from that version’s changelog section and appear in the app. Missing descriptions or inconsistent package versions block publishing. Already published versions are immutable: bump the version for each new release. The workflow uses GitHub's temporary token; there is no personal GitHub token or OpenAI key in the app or repository.

If a release job stops after creating a draft, inspect that draft before retrying; delete the incomplete draft to allow a fresh build of the same version. Published releases are never replaced by the workflow. GitHub Actions must be enabled with the workflow's declared write permission. Windows signing has not been configured; installers are currently unsigned.

## Local data and AI

Chats, notes, settings, and imported materials stay in the Windows app-data folder for Studora. Open that folder from Settings. Avoid deleting it when upgrading. Your OpenAI API account is connected inside Settings; its key uses Windows secure storage when available, with a session-only fallback. Asking the tutor sends the chosen learning context to OpenAI. Nothing in your study workspace is uploaded to GitHub by the update feature.

PDF, Word, image, and text imports, lesson/example organization, interactive geometry, working-board drawings, source-based explanations, practice, exam planning, and bilingual Arabic tutoring are included. Video sources currently use pasted transcripts.

This repository is public and contains application code only. Never commit study files, API keys, workspace backups, or signing certificates.

When you request a completed app change, the development agent handles the version, description, publishing, and verification as recorded in AGENTS.md. You do not need to create the release yourself.

### AI connection diagnostics

In Settings → AI connection, save your API key, choose an available tutor model, and click **Test selected model**. This sends a small billed request with a 256-token output cap and no study sources. The test uses the selected reasoning setting and records usage. Model discovery only checks listing access; the test checks actual inference access. Standard models omit reasoning parameters. Legacy completion models cannot run the tutor. ChatGPT subscriptions and OpenAI API credits are separate. Keys stay local and never enter backups or GitHub.

Run `node scripts/ai-ui-test.cjs` to verify connection diagnostics and request compatibility with a mocked provider and disposable test key; no live OpenAI requests are made.

### Use ChatGPT without an API key

Settings → AI connection defaults to ChatGPT plan. Click **Continue with ChatGPT**, authorize Studora in the system browser, and choose a model from your account. Eligibility, models, and limits are controlled by OpenAI. Keep paid credits disabled in ChatGPT Usage settings if you want included usage only. Studora never falls back to a paid API key. OAuth credentials are encrypted separately from study data and excluded from backups. If secure storage is unavailable, the connection lasts for the session only.

Tutoring stays inside Studora: sign in, select a model, and send a question. OpenAI controls account eligibility and limits; Studora shows restrictions without a copy/paste workaround or automatic paid fallback.

Official integration references: https://developers.openai.com/siwc/token-sharing-open-source/sign-in and https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference .

### App icon

The editable brand source is `ui/brand.svg`. Raster assets and a multi-size Windows ICO live in `assets/`. Executable resource editing applies the Windows icon and metadata while code signing remains disabled.
