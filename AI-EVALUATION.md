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

## Studora 0.1.8 development checks

Ten new Grade 10 style questions covered all eight subjects. The initial run used an experimental 16,384-token context; seven answers supplied the required facts without the material failures below. This is a small development sample, not a curriculum accuracy estimate.

| Subject | Complete initial answers | Checks |
| --- | --- | --- |
| Math | 1/2 | Isosceles angle deductions; similar-triangle correspondence |
| English | 1/1 | Present-perfect passive voice and auxiliaries |
| Physics | 1/1 | Acceleration and net force |
| Biology | 1/1 | Mitosis/meiosis chromosome numbers and fertilization |
| Chemistry | 0/1 | Balance aluminum oxide and calculate moles |
| Arabic | 1/2 | Dual subject and case marker; passive-verb parsing |
| Islamic Studies | 1/1 | Apply a supplied Quranic excerpt without inventing hadith |
| KSA Studies | 1/1 | Distinguish two supplied milestones and calculate their interval |

The initial math and chemistry failures returned native calculator notation instead of explanations. The adapter now recognizes narrowly defined calculator expressions, validates them through the existing calculator gate, hides tool notation, and retries unsupported notation as an ordinary explanation. Follow-up instructions require the final answer to restate the method because a pre-tool draft is not retained. A regression test checks this recovery path. Written calculator expressions in math/physics also receive an actual arithmetic check. These checks do not establish a proof.

An initial Arabic answer correctly identified the dual subject and alif, but called alif an original marker and gave a singular noun as an example of dual noun annexation. Additional reviewed reference rules did not reliably fix this. The final Arabic recheck still invented incorrect annexation examples and mixed original and secondary markers. **Arabic grammar remains unreliable.** A correct first sentence does not make the entire explanation correct.

A larger context slowed checks and one chemistry recheck suffered an engine failure. The released configuration returns to 8,192 context tokens. At that setting, the final development rechecks took about 89 seconds for math, 71 for chemistry and 64 for Arabic on this laptop. Math returned A=44°, C=68° and a real calculator result for the 180° sum. Chemistry returned 4Al + 3O2 → 2Al2O3, matching 4 Al/6 O atoms and 1 mol. Arabic failed as described above. Rechecks reused development questions and are not independent evidence of a higher accuracy percentage; laptop load and temperature affect timings.

Separately, the real local model generated a three-question mixed physics test in about 224 seconds with schema-constrained output. All three generated answer keys were checked: 5 m/s², 4 m/s² and 40 m. This small, easy sample does not establish practice-test reliability.

There is no forced tutoring word count. A local generation segment now permits up to 2,048 tokens, and length-limited text continues automatically until the model finishes, the student stops it, it repeats without progress, or the 20-minute request timeout expires. Structured test questions retain a smaller per-question bound so malformed JSON can be retried safely. No additional model was downloaded and no model weights were trained.

`scripts/tutor-eval.cjs` and `test/tutor-eval-cases.json` preserve reproducible checked cases for future manual evaluations. They use disposable study data and an existing installed model. Expected facts are supplied beside answers; the script does not automatically certify semantic correctness.
