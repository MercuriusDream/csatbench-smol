# CSAT-benchmark-smol

Small open-weight language models take the 2026 Korean college entrance exam, the 2026학년도 대학수학능력시험.

The scores are at [csat.mercuriusdream.com](https://csat.mercuriusdream.com/).

## Why

The defences proposed against AI in the exam hall work on the network: jamming, Wi-Fi shut off, radio detectors. A model of this size needs no network. Each one on the board fits in the memory of a laptop, and the smallest fit in a phone.

## Method

The harness is [hehee9/CSAT-benchmark](https://github.com/hehee9/CSAT-benchmark), at commit `b55e2c0`. Questions are asked, answers are read out of the replies, and the answers are graded and totalled with its code.

- **One question per request.** This is CSAT-benchmark's 쉬움 mode (`--easy`).
- **The whole exam.** 13 papers, 247 questions: 국어 (공통, 화법과 작문, 언어와 매체), 수학 (공통, 확률과 통계, 미적분, 기하), 영어, 한국사, and four 탐구 papers (물리학Ⅰ, 화학Ⅰ, 생명과학Ⅰ, 사회·문화).
- **Total out of 450**, by CSAT-benchmark's formula. 국어 and 수학 are each the common part plus the mean of the electives, out of 100. 영어 is out of 100 and 한국사 out of 50. 탐구 is the mean of the four papers times two, out of 100.
- **Sampling is the model's own**: the settings its repository, its vendor or its server gives.
- **No cap on an answer's length** other than the model's own or its server's.
- **Thinking.** A row marked "no thinking" ran with thinking switched off. Gemma 4 is on the board both ways.
- **No answer.** A question that comes back without an answer is asked again. One still without an answer at the end is marked wrong, as CSAT-benchmark marks it.

## Sizes

The chart of totals by GB places each model at the size of its published weights:

| Model | Weights | GB |
| --- | --- | ---: |
| Gemma 4 12B | Ollama `gemma4:12b-it-qat`, model and vision projector | 7.16 |
| Gemma 4 E4B | Ollama `gemma4:e4b-it-qat`, model and vision projector | 6.14 |
| Gemma 4 E2B | Ollama `gemma4:e2b-it-qat`, model and vision projector | 4.34 |
| Ternary Bonsai 2 27B | `prism-ml/Ternary-Bonsai-2-27B-mlx-2bit` | 8.60 |
| Ternary Bonsai 2 9B | `prism-ml/Ternary-Bonsai-2-9B-mlx-2bit` | 3.46 |
| Nanbeige4.2 3B | `Nanbeige/Nanbeige4.2-3B-FP8` | 5.19 |
| Qwen3.5 2B | Ollama `qwen3.5:2b-q4_K_M`, model and vision projector | 1.94 |
| Kanana-2 1.3B | `kakaocorp/kanana-2-1.3b-instruct` | 2.58 |
| LFM3 1.7B | `LiquidAI/LFM3-1.7B-MLX-8bit` | 1.84 |
| LFM3-VL 2B | `LiquidAI/LFM3-VL-2B-MLX-4bit` | 1.59 |

Under the sizes the chart names devices with that much memory: Galaxy Watch8 2 GB, iPhone 15 6 GB, iPhone 16 Pro 8 GB, Galaxy S26 12 GB, and the graphics memory of an RTX 5060 (8 GB), RTX 5070 (12 GB), RTX 5080 (16 GB), RTX 4090 (24 GB) and RTX 5090 (32 GB).

## What is not here

The exam's text and figures are the work of KICE (한국교육과정평가원) and are not in this repository. Neither are the models' replies, which quote them. The papers and answer keys are published at [suneung.re.kr](https://www.suneung.re.kr/).

## The site

The page is React and plain CSS, built with Bun. It follows the design of [mercuriusdream.com](https://mercuriusdream.com/) and is one of its sibling sites.

```sh
bun install
bun run dev      # the page, rebuilt as files change
bun run build    # dist/, with the page's markup written into the HTML
bun run preview  # dist/ served the way GitHub Pages serves it
```

`src/board.js` holds the scores, and nothing else. `src/content.js` holds every word on the page; the build also writes them to `llms.txt`.

A push to `main` builds and deploys through `.github/workflows/deploy.yml`. The custom domain is set in the repository's Pages settings, and DNS has one record for it: `csat` as a CNAME to `mercuriusdream.github.io`.
