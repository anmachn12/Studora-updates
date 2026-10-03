# Local tutor components

Studora downloads these components separately during local tutor setup. The application repository and Windows installer do not contain model weights or the inference engine.

- **Gemma 4 E4B instruction-tuned model**, Google DeepMind, Apache License 2.0. Model card: https://ai.google.dev/gemma/docs/core/model_card_4. Original weights: https://huggingface.co/google/gemma-4-E4B-it. Local GGUF conversion: https://huggingface.co/ggml-org/gemma-4-E4B-it-GGUF. License: https://www.apache.org/licenses/LICENSE-2.0.
- **llama.cpp**, ggml-org and contributors, MIT License. Project and license: https://github.com/ggml-org/llama.cpp/blob/master/LICENSE. The Windows runtime includes additional libraries and their notices, including LICENSE-LLVM-OpenMP, in its extracted engine folder.
- **PDF.js** and its optional **@napi-rs/canvas** renderer prepare PDF pages for local vision. Their package licenses accompany the dependencies installed by npm.

The exact release URLs, immutable model revision, sizes, and SHA256 checksums are recorded in `local-ai-config.json`. Setup verifies downloads before running the engine. The local tutor is a third-party pretrained model; saved tutoring guidance changes the context supplied to it and does not modify its weights.

The local model can make factual, reasoning, grammatical, and image-reading mistakes. Its results have not been certified for 99% accuracy or for any particular curriculum.
