# Local tutor evaluation — 3 October 2026

Studora 0.1.7 uses the instruction-tuned Gemma 4 E4B Q4_0 model with its image projector. These are application evaluations, not training of model weights. No API charges were used. Questions and reference excerpts were prepared for these tests; the student's textbooks and school marking schemes were not available.

## Baseline: all eight subjects

Fifteen Grade 10 style questions were sent through Studora's real local provider. Main answers were reviewed against prepared answers, including essential explanations. An engine error on the chemistry mole question was retried; its incomplete response counted as a failure.

| Subject | Complete main answers | What was checked |
| --- | --- | --- |
| Math | 2/2 | Exterior/interior angles; corresponding sides in similar triangles |
| English | 2/2 | Literary devices with a provided passage; passive voice preserving tenses |
| Physics | 2/2 | Uniform acceleration and distance; kinetic energy and doubled speed |
| Biology | 1/2 | Mitosis/meiosis; controlled photosynthesis experiment |
| Chemistry | 1/2 | Balanced iron oxide equation and atom counts; moles and molecules |
| Arabic | 0/1 | Dual noun parsing and its case marker |
| Islamic Studies | 0/2 | Apply a provided verse excerpt; distinguish Quranic evidence from hadith |
| KSA Studies | 2/2 | Distinguish the recovery of Riyadh from the proclamation of the Kingdom |

The baseline completed **10 of 15** main answers. This small sample does not establish accuracy across a curriculum. An unrequested math practice artifact contained a wrong answer despite the correct main explanation. Practice tools are now restricted to explicit requests, and duplicate artifacts are removed.

## Rechecks after application changes

The five failed questions were repeated after clearer source instructions, a short reviewed subject reference, and clarification of the exact Arabic sentence. These repeats were used during development and are not an independent benchmark.

- Biology: corrected the claim that one gas bubble is one molecule; identified bubble-size variation and appropriate variables.
- Chemistry: supplied both requested final values, 0.5 mol and 3.011 × 10²³ molecules. Its written unit-cancellation description was imprecise.
- Islamic Studies: both requests were answered using the supplied excerpt; the tutor stopped asking for a source that was already included.
- Arabic: still failed. It identified the subject and alif correctly, then falsely claimed that the dual's nun disappears in the nominative. **Arabic grammar remains a material limitation.**

## Photos and diagrams

Separate real-model checks correctly solved clear triangle angle and side diagrams, and asked for missing information in an underspecified drawing. Through the real app, another angle photo produced 60°, and a clear Arabic sentence photo was parsed correctly in the final answer. Earlier intermediate text was contradictory; intermediate tool drafts are now omitted from the saved answer. These are few, simple images, not evidence that arbitrary scans or difficult diagrams will be solved correctly.

## Performance and limits

On the student's Ryzen 7 5800H, 16 GB RAM, RTX 3050 laptop, ordinary warm answers in the final rechecks took about 10 seconds. Chemistry and Islamic Studies rechecks took about 25–53 seconds; the first Arabic recheck took 116 seconds. Startup, images, tool use, available memory and laptop temperature affect these times. The interface streams visible answer text; hidden reasoning is not shown.

The calculator and simple arithmetic equality checks can catch some numerical errors. They do not verify a proof, the interpretation of a diagram, Arabic grammar, or an entire explanation. The local model has **not achieved or demonstrated 99% accuracy**. Use assigned sources and review important steps.

## Storage

The pinned model, image projector and engine download total about 5.61 GB. The model runs locally after setup. “Use existing download” verifies existing assets and reuses model storage with hard links on the same drive; it does not download a second model. Rejected model downloads are not part of the application or release.
