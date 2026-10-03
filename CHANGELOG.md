# Studora 0.1.8

Take a saved practice test and navigate lessons with a clear sidebar hierarchy.

- Expand or collapse modules and lessons separately. Conversations sit in a distinct branch beneath their lesson. Keep the active chat highlight separate from the lesson, and remember collapsed sections.
- Create 3, 5, or 8 question tests from a lesson, topic, and selected sources in every subject. Choose multiple choice, written answers, or a mix. Arabic subject questions remain Arabic.
- Answer in a dedicated Practice workspace, with saved progress and an answer key hidden until submission. Score multiple-choice questions automatically against the AI answer key; review written answers against model answers and mark them yourself.
- Review explanations and supporting source references, retake a test without replacing the earlier attempt, and preserve older chat practice.
- Keep streamed replies attached to the conversation that started them when switching subjects or chats. Restore the in-progress reply when returning, and preserve drafts in other subjects.
- Render bold text, lists, math, and source citations as answers stream.
- Remove the forced short-answer instructions. Continue local replies automatically across per-response token limits, raise the generation allowance from 1,200 to 2,048 tokens per segment, and preserve streamed text if a response is interrupted.
- Improve calculator-call handling and the reviewed Arabic reference; include reproducible evaluation questions across all eight subjects. These are application improvements, not training new model weights.
- Save a printable A4 question paper or a separate answer-key PDF, including mathematical notation and Arabic fonts.
- Validate generated question structure and source references. Stop test creation safely; failed generation keeps your existing tests. No new model download is required.

AI questions and answer keys may contain errors. Practice results are not school grades or proof of mastery.

# Studora 0.1.7

Chat directly with a free tutor running on your computer, and organize materials in lesson folders.

- Create, rename, and remove source folders in every subject. Move photos, PDFs, Word documents, and text between folders. Link a folder to a lesson to include its current files when studying that lesson. Removing a folder keeps its files in Unfiled. Folder organization is preserved in backups.
- Add Gemma 4 local AI for all eight subjects, with no cloud account, API key, subscription, or per-message charges.
- Set up the tutor once in AI connection. Show download progress, allow pause/resume, and verify the engine and model before installation. The one-time download is about 5.61 GB. Use existing download to reuse verified files on the same drive without another model copy.
- Read answers as they are generated. Keep ordinary questions on a faster path and add a short review step for Arabic, chemistry, Islamic Studies and proofs.
- Solve questions from photos and diagrams. Convert selected PDF pages into images; support selected page ranges in scanned PDFs and keep the original source references.
- Use numerical learning tools and check simple arithmetic equalities. These checks do not prove geometry or guarantee the whole answer.
- Save editable Tutor guidance per subject, including checked corrections and teaching preferences. This changes future tutoring context; it does not train model weights.
- Keep local tutoring data on this computer and release the engine’s memory after two idle minutes. Never fall back to a paid provider.
- Preserve existing study data and connection choices. A previously unavailable ChatGPT connection can switch to the installed free tutor.

Local AI can still make mistakes. It has not been certified for 99% accuracy or for your specific textbook. First startup and photo questions take longer than ordinary follow-ups.

# Studora 0.1.6

Organize every subject the way its textbook works.

- Math uses chapters, lesson identifiers such as 2.1, and any number of worked examples. Example lists start empty so they match your book.
- Physics, Biology, and Chemistry use modules with numbered lessons, such as Module 20 → Lesson 1.
- Arabic and KSA Studies use lesson names without required chapter, lesson, or example numbers. English and Islamic Studies start with named lessons too.
- Customize each subject in Lesson organization: choose chapters, modules, or names; change group labels and numbering; enable or disable worked examples.
- Apply the chosen structure to the sidebar, lesson forms, conversation labels, search, and tutor context.
- Preserve existing lessons, chats, sources, page ranges, and example lists when you change structure or upgrade.

# Studora 0.1.5

A distinctive new Studora icon, with tutoring kept inside your learning workspace.

- Replace the generic app icon with a forest-green S ribbon and a folded-page detail.
- Use the same brand mark in the desktop shortcut, Windows executable, taskbar, tray, app header, and Home button.
- Include nine Windows icon sizes so the mark stays clear at small and large display sizes.
- Remove the copy/paste ChatGPT workflow. Ask questions and receive answers directly inside Studora after connecting an eligible ChatGPT account.
- Retry a rejected sign-in code once with a fresh authorization and the issued account registration. Show clearer errors, hide sensitive details, and preserve existing connections when a retry fails.
- Keep unsent questions when sign-in is required, and explain connection restrictions in the app. Never fall back to a paid API key automatically.

# Studora 0.1.4

Use eligible ChatGPT plan access without a paid API key, with clearer model choices and connection diagnostics.

- Continue with ChatGPT using the official browser sign-in flow. Available models and usage limits come from your signed-in account. Access depends on OpenAI account eligibility.
- Switch between saved ChatGPT accounts, manage plan usage, and disconnect securely. Studora never switches to a paid API key automatically.
- Use the browser study option if plan access is unavailable: prepare a lesson prompt with selected source excerpts, copy it into ChatGPT, then paste the explanation back into the subject conversation.

- Exclude legacy completion and specialized models from the tutor model picker.
- Choose an available tutor model from a dropdown, with an advanced model ID field for customization.
- Omit unsupported reasoning settings for standard models such as GPT-4.1 and GPT-4o.
- Refresh model choices after saving a key and explicitly test your selected model and settings. The tiny test is billed to your API account and sends no study sources.
- Explain invalid keys, inaccessible models, exhausted API quota, permissions, rate limits, and connection failures without exposing API keys or internal IPC errors.
- Clarify that ChatGPT Free or Plus does not include API usage. Saving a key alone does not verify model access.

# Studora 0.1.3

Switch subjects and workspace tabs with a calmer, smoother transition.

- Blend the outgoing and incoming workspace with a short fade and subtle slide.
- Keep the subject rail and window controls steady while content changes.
- Reverse the motion when moving back through subjects or tabs.
- Rapid switches go straight to your latest selection without queued animations.
- Respect reduced-motion preferences and restore saved conversation drafts when returning to a subject.

# Studora 0.1.2

Updates are easier to receive, understand, and install without interrupting your study session.

- See an in-app update notification and a clear description of what changed.
- Choose Install and restart; Studora saves your workspace before restarting.
- Closing the window keeps the updater in the Windows tray, where new releases download automatically.
- Background updates start at Windows sign-in and check every 30 minutes. Turn them off in Settings or choose Quit Studora from the tray.
- Each future update includes its own version, description, tested build, and GitHub release.

# Studora 0.1.1

- Check for updates directly above Settings in the subject rail.
- See available versions, download progress, and a restart/install action.
- Preserve study files and save chats before restarting for an update.
- Connect stable Windows releases to anmachn12/Studora-updates.
- Update PDF and calculation dependencies.
