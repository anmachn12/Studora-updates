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

## Studora 0.1.11 timed challenge loop

The loop used the existing E4B model and image projector through the real app. No model weights were trained, no API requests were purchased, and no new model was downloaded. Eight prepared challenge cases cover all subjects: marked geometry, compound Arabic parsing, projectile motion, a limiting reagent, linkage data with a supplied rule, literary inference/passive voice, Quranic evidence versus unsupported accusations, and KSA chronology/causation. Some challenges exceed an individual school's Grade 10 syllabus. These are development examples, not school marking schemes or an independent accuracy benchmark.

The first eight-minute run attempted seven cases. Six hit a 75-second whole-request budget; Islamic Studies received only the remaining 30 seconds. No final answer completed. KSA was not reached in that run. Aborting restarts the engine, so these failures include repeated cold starts, not just answer-generation time. The geometry image yielded no visible answer before its budget expired. This does not establish diagram-solving accuracy.

The second run warmed the engine with a trivial readiness request (36.2 seconds, excluded from question timings). After irrelevant subject tools were removed:

| Case | First streamed text | Whole-request result | Manual review |
| --- | --- | --- | --- |
| Arabic compound parsing | 51.4 s | Finished in 80.0 s | Failed: the four main roles/cases were correct, but the explanation called ya an original marker, confused nun with waw deletion, and misidentified grammatical roles in additional examples. |
| Chemistry limiting reagent | 12.4 s | Stopped at 120.0 s | Correct core answers were visible: HCl limiting, 0.15 mol H2, 3.6 dm³ gas, 1.2 g Mg left. It was still adding checks when stopped; this is an unfinished response, not a completed pass. |
| Biology linkage | 90.1 s (including 31.7 s startup) | Stopped at 120.0 s | Correct expected counts, parental/recombinant classes and 5% were visible. The qualification about genetic versus physical distance was unfinished. It also described a calculator result without an actual tool artifact. |
| English analysis | None (startup 33.4 s) | Stopped at the remaining 70.0 s | No visible answer available to grade. |

The arithmetic checker now covers eligible Chemistry equalities as well as Math/Physics. It checks arithmetic only, not units, reaction interpretation or a complete solution. Tool selection retains concept walkthroughs in every subject, geometry workspaces in Math, and calculators for Math/sciences or numerical prompts/source excerpts. Practice tools require an explicit request, even when a source mentions practice. The final selection preserves calculator access for numerical biology/history work that the preliminary second-run profile omitted.

The Arabic general reference now explicitly contrasts original and secondary dual markers, nun versus waw deletion, and subject versus object roles after verbs. A final development repeat follows below. Reusing the same question and its discovered errors is not independent evidence of accuracy. Extra review is disabled only in that disposable final test workspace, so it is not a controlled measurement of reasoning versus reference improvements.

The harness records partial text, first visible streaming, engine startup events and the extra-review setting, accepts an ordered subset of cases, and optionally measures warmup separately. The test time budget is separate from Studora's normal long-answer continuation; the app's answer limit has not been reduced. Measurements are sensitive to available memory, temperature, tool rounds and startup. These runs do not demonstrate 99% accuracy, consistently faster answers, or parity with larger hosted models.

The final run warmed up in 31.2 seconds. With the released subject-tool selection and expanded Arabic reference:

- KSA: first text at 37.9 seconds, completion at 68.8 seconds. It calculated 23 and 7 years correctly and correctly refused to derive a sole cause from the timeline. It did not explicitly give the requested three-event ordered list and treated the identity claim as merely unsupported rather than directly refuting it using the distinct events/dates. This is partial task coverage, not a full pass.
- Arabic: first text at 2.6 seconds, completion at 77.3 seconds. The four requested roles, cases, markers, secondary-marker distinction, nun rule and annexation examples were correct. However, an additional sentence grouped inna clauses with verbal sentences, which is incorrect; the whole explanation still fails a strict no-factual-error review. These corrected core answers are useful development progress, not proof that Arabic grammar is reliable. Reference changes, warm cache and disabling extra review were changed together, so the first-text difference cannot be attributed to one change.

The real-model loop ran approximately 20 minutes (18:47:35–19:07:40 UTC), following preparation. Thirteen question attempts covered all eight subjects, including repeated development cases; seven baseline attempts, four second-run attempts and two final attempts. Only three returned completed final responses; all three had omissions or factual errors under the full-answer criteria. Timed-out Chemistry had correct core calculations, but no overall accuracy percentage is warranted. Islamic Studies and the geometry image timed out without reviewable text in the baseline; Physics only began streaming near its cutoff. Their answer quality remains unmeasured in this loop. Release packaging/verification follows the bounded model loop.

Validation: 55 automated tests passed, plus the local tutor interface test (setup, saved guidance, direct in-app answers and no paid/external fallback). These validate app behavior, not model answer accuracy. Canonical changes preserve existing models, study data and the normal reasoning toggle. The lack of completed hard responses demonstrates that repeated prompting on this hardware is not a substitute for a stronger model.
