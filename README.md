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

Chats, notes, settings, and imported materials stay in the Windows app-data folder for Studora. Open that folder from Settings. Avoid deleting it when upgrading. New workspaces default to the free local tutor. After its one-time 5.61 GB setup, Gemma 4 runs on your computer without a cloud account or API charges. This mode sends messages and selected materials only to the local inference engine. Other AI connections send selected context to their provider; OpenAI API keys use Windows secure storage when available. Nothing in your study workspace is uploaded to GitHub by the update feature.

PDF, Word, image, and text imports, lesson/example organization, interactive geometry, working-board drawings, source-based explanations, practice, exam planning, and bilingual Arabic tutoring are included. Video sources currently use pasted transcripts.

This repository is public and contains application code only. Never commit study files, API keys, workspace backups, or signing certificates.

When you request a completed app change, the development agent handles the version, description, publishing, and verification as recorded in AGENTS.md. You do not need to create the release yourself.

### AI connection diagnostics

In Settings → AI connection, save your API key, choose an available tutor model, and click **Test selected model**. This sends a small billed request with a 256-token output cap and no study sources. The test uses the selected reasoning setting and records usage. Model discovery only checks listing access; the test checks actual inference access. Standard models omit reasoning parameters. Legacy completion models cannot run the tutor. ChatGPT subscriptions and OpenAI API credits are separate. Keys stay local and never enter backups or GitHub.

Run `node scripts/ai-ui-test.cjs` to verify connection diagnostics and request compatibility with a mocked provider and disposable test key; no live OpenAI requests are made.

### Use ChatGPT without an API key

ChatGPT plan is an optional connection in Settings → AI connection. Click **Continue with ChatGPT**, authorize Studora in the system browser, and choose a model from your account. Eligibility, models, and limits are controlled by OpenAI. Keep paid credits disabled in ChatGPT Usage settings if you want included usage only. Studora never falls back to a paid API key. OAuth credentials are encrypted separately from study data and excluded from backups. If secure storage is unavailable, the connection lasts for the session only.

Tutoring stays inside Studora: sign in, select a model, and send a question. OpenAI controls account eligibility and limits; Studora shows restrictions without a copy/paste workaround or automatic paid fallback.

Official integration references: https://developers.openai.com/siwc/token-sharing-open-source/sign-in and https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference .

### App icon

The editable brand source is `ui/brand.svg`. Raster assets and a multi-size Windows ICO live in `assets/`. Executable resource editing applies the Windows icon and metadata while code signing remains disabled.

### Subject lesson organization

In a subject's Lessons tab, choose **Lesson organization** (also available in Subject options and Settings → Subjects & organization). Math starts with chapters, numbered lessons, and optional worked-example labels. Science subjects start with modules and numbered lessons. Arabic, KSA, English, and Islamic Studies start with lesson names. Choose a preset or customize grouping, labels, numbering, and examples for each subject. Changing structure keeps saved lesson fields and sources; hidden fields return when re-enabled. Run `node scripts/lessons-ui-test.cjs` to check subject forms, AI context, migration, and persistence with a mocked provider.

### Free local tutor

Choose **Free local tutor** in Settings → AI connection and click **Set up free tutor**. Setup downloads pinned, checksum-verified engine and model components, supports pause/resume, and shows progress. It requires about 5.61 GB for the download plus engine storage, and runs best on Windows with 16 GB RAM and a dedicated GPU. It can use CPU memory when the full model does not fit the GPU. Initial startup takes longer than follow-up replies. The engine releases memory after two idle minutes and stops when Studora quits.

Chat directly in any subject. Answers appear while they are generated; numerical checks use the existing calculator, and selected PDF pages become images for the vision model. Select a short lesson excerpt and at most two photos or PDF pages per question. Scanned books with many pages require a photo of the relevant page. Video requires a transcript. Sources, recent messages and saved subject guidance are included within a bounded local context. Important diagram labels must remain legible.

**Tutor guidance** beside each subject in Settings saves checked corrections and teaching preferences for future conversations. This is editable context, not weight training. **Extra review for harder questions** adds a short reasoning step for Arabic, chemistry and proofs; turning it off favors speed. Local tutoring has no API billing and never falls back to a paid provider. It does not guarantee perfect answers or 99% accuracy.

Run `node scripts/local-ai-ui-test.cjs` for a mocked local connection test; `npm test` also covers the adapter, streaming, download integrity and PDF preparation. Runtime/model binaries are excluded from Git and the installer. See [third-party notices](THIRD-PARTY-NOTICES.md).

## Source folders

Open a subject → Sources → New folder. Optionally link a lesson. Add materials while that folder is selected or move existing files using each source’s Folder selector. Folder removal keeps files in Unfiled; backups include folder organization.

If the local AI was already downloaded, choose Settings → AI connection → Free local tutor → Use existing download and select its folder. Studora verifies the model and engine, then reuses model storage on the same drive. No second model download is needed.
