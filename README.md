# AI eBook Creator

> Generate complete, professional eBooks from a single topic using AI — title, outline, chapters, and PDF export — all automated.

---

## Features

- **AI-generated content** — title, structured outline, and full chapter text via OpenAI GPT-4o / Anthropic Claude
- **Multi-language support** — generate eBooks in EN, PT-BR, ES, FR, DE, IT, JP, ZH, and more
- **Depth levels** — basic, intermediate, or advanced writing style
- **PDF export** — clean, typographically polished PDF via Puppeteer (no external tools needed)
- **Markdown output** — portable, editable raw output for every eBook
- **Web UI** — real-time progress stream, chapter tracking, and instant download
- **REST API** — SSE-powered `/api/generate` endpoint for integrations
- **CLI** — single command generation for terminal use
- **Multi-provider** — OpenAI, Anthropic Claude, or any OpenAI-compatible API (Ollama, Together, etc.)

---

## Architecture

```
ai-ebook-creator/
├── src/
│   ├── index.ts              # CLI entry point (Commander)
│   ├── server.ts             # Express REST API + SSE streaming
│   ├── ai/
│   │   ├── llmClient.ts      # Multi-provider LLM client
│   │   └── prompts/
│   │       ├── title.ts      # Title & description prompts
│   │       ├── summary.ts    # TOC / outline prompt
│   │       └── chapter.ts    # Chapter writing prompt
│   ├── ebook/
│   │   ├── types.ts          # Shared TypeScript types
│   │   ├── createEbook.ts    # Main orchestration pipeline
│   │   └── buildMarkdown.ts  # Markdown assembly
│   └── export/
│       ├── markdown.ts       # Save .md to disk
│       └── pdf.ts            # Puppeteer HTML→PDF converter
├── web/                      # Next.js 15 frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx
│       │   └── api/
│       │       ├── generate/ # SSE proxy route
│       │       └── download/ # File download proxy
│       └── components/
│           ├── EbookForm.tsx
│           ├── ProgressTracker.tsx
│           └── EbookResult.tsx
├── output/                   # Generated files (git-ignored)
├── .env.example
└── package.json
```

### Generation Pipeline

```
Topic → [AI] Title
      → [AI] Description
      → [AI] Table of Contents (JSON)
      → [AI] Chapter 1…N (parallel-capable)
      → Markdown assembly
      → PDF via Puppeteer
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/tiagocomputer/ai-ebook-creator
cd ai-ebook-creator
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY or ANTHROPIC_API_KEY
```

### 3. Use the CLI

```bash
# Basic usage
npx ts-node src/index.ts "Personal Finance for Beginners"

# With options
npx ts-node src/index.ts "Machine Learning" \
  --language "en-US" \
  --chapters 10 \
  --depth advanced
```

### 4. Start the API server

```bash
npm run serve
# → http://localhost:3001
```

### 5. Start the web UI

```bash
cd web && npm install && npm run dev
# → http://localhost:3000
```

---

## API Reference

### `POST /api/generate`

Streams eBook generation progress via Server-Sent Events.

**Request body:**
```json
{
  "topic": "Personal Finance for Beginners",
  "language": "en-US",
  "chaptersCount": 8,
  "depthLevel": "intermediate"
}
```

**SSE event format:**
```json
{
  "step": "chapter",
  "message": "Writing chapter 3/8: "Budgeting Basics"…",
  "progress": 45,
  "data": { "chapterIndex": 3, "title": "Budgeting Basics" }
}
```

**Steps:** `title` → `summary` → `chapter` (×N) → `export` → `done`

### `GET /api/download/:id/:format`

Download a generated file. Format: `pdf` or `md`.

### `GET /api/health`

Returns `{ status: "ok", version: "1.0.0" }`.

---

## Programmatic Usage

```typescript
import { createEbook } from './src/ebook/createEbook';

const result = await createEbook(
  {
    topic: 'Introduction to Kubernetes',
    language: 'en-US',
    chaptersCount: 10,
    depthLevel: 'advanced',
  },
  (event) => console.log(`[${event.progress}%] ${event.message}`),
);

console.log('PDF saved to:', result.pdfPath);
```

---

## AI Provider Configuration

| Provider | Env var | Default model |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` |
| Anthropic Claude | `ANTHROPIC_API_KEY` | `claude-haiku-4-5-20251001` |
| OpenAI-compatible | `LLM_BASE_URL` + `LLM_API_KEY` | `LLM_MODEL` |

The client auto-detects the provider from available env vars.

---

## Roadmap

- [ ] AI-generated cover image (DALL-E / Stable Diffusion)
- [ ] EPUB export with custom styles
- [ ] Parallel chapter generation (faster)
- [ ] Template themes (technical book, self-help, business)
- [ ] Chapter regeneration / editing
- [ ] Multi-model selection in the UI

---

## License

MIT — [tiagocomputer](https://github.com/tiagocomputer)
