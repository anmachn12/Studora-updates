# Studora release workflow

The user has authorized publishing completed Studora changes to this repository, including the version and update description. Handle the release as part of each requested app change.

- Work from this Git checkout and preserve the existing app ID and local study data.
- Before publishing a completed change, run relevant tests, increment the package version in both package.json and package-lock.json, and write a clear, user-facing section in CHANGELOG.md describing the actual changes.
- Use scripts/release-notes.cjs to validate the release description. Publish only that version's notes, not the whole changelog.
- Commit and push completed changes to main. GitHub Actions builds and publishes the Windows installer and update metadata automatically. Verify the workflow and public release; report failures honestly and fix them when possible.
- Never commit credentials, private study files, chats, notes, workspace backups, node_modules, or built installers. Published versions are immutable; use a new version for every update.
- Report the published version and important changes to the user. Ordinary authorized app updates do not require another publication confirmation.
- Show an in-app notification with release descriptions and an Install and restart action. When the window is closed, download new releases automatically using the Windows tray updater. Preserve the Settings opt-out. Do not interrupt a study session for an update or install without the user's click.
