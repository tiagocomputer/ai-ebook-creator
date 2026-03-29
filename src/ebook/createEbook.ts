import { v4 as uuidv4 } from 'uuid';
import { generateText, generateJSON } from '../ai/llmClient';
import {
  buildTitlePrompt,
  buildDescriptionPrompt,
  buildSummaryPrompt,
  buildChapterPrompt,
} from '../ai/prompts';
import {
  EbookInput,
  EbookResult,
  ChapterMeta,
  Chapter,
  ProgressCallback,
  ProgressEvent,
} from './types';
import { buildMarkdown } from './buildMarkdown';
import { saveMarkdown } from '../export/markdown';
import { convertToPdf } from '../export/pdf';

export async function createEbook(
  input: EbookInput,
  onProgress?: ProgressCallback,
): Promise<EbookResult> {
  const emit = async (event: ProgressEvent) => {
    if (onProgress) await onProgress(event);
  };

  const totalSteps = 3 + input.chaptersCount + 2; // title+desc, summary, N chapters, markdown, pdf
  let completedSteps = 0;

  const step = async (event: Omit<ProgressEvent, 'progress'>) => {
    completedSteps++;
    await emit({ ...event, progress: Math.round((completedSteps / totalSteps) * 100) });
  };

  // ── 1. Generate title ──────────────────────────────────────────────────────
  await emit({ step: 'title', message: 'Generating title…', progress: 0 });
  const title = await generateText(buildTitlePrompt(input));
  await step({ step: 'title', message: `Title: "${title}"`, data: { title } });

  // ── 2. Generate description ────────────────────────────────────────────────
  const description = await generateText(buildDescriptionPrompt(title, input));
  await step({ step: 'title', message: 'Description ready', data: { description } });

  // ── 3. Generate summary / table of contents ────────────────────────────────
  await emit({ step: 'summary', message: 'Generating table of contents…', progress: Math.round((completedSteps / totalSteps) * 100) });
  const chaptersMeta = await generateJSON<ChapterMeta[]>(buildSummaryPrompt(title, input));
  await step({ step: 'summary', message: `${chaptersMeta.length} chapters outlined`, data: { chaptersMeta } });

  // ── 4. Generate chapters ───────────────────────────────────────────────────
  const chapters: Chapter[] = [];
  for (let i = 0; i < chaptersMeta.length; i++) {
    const meta = chaptersMeta[i];
    await emit({
      step: 'chapter',
      message: `Writing chapter ${i + 1}/${chaptersMeta.length}: "${meta.title}"…`,
      progress: Math.round((completedSteps / totalSteps) * 100),
      data: { chapterIndex: i + 1, title: meta.title },
    });

    const content = await generateText(
      buildChapterPrompt(title, meta, i + 1, chaptersMeta.length, input),
      { maxTokens: 8192 },
    );

    chapters.push({ index: i + 1, ...meta, content });
    completedSteps++;
    await emit({
      step: 'chapter',
      message: `Chapter ${i + 1} complete`,
      progress: Math.round((completedSteps / totalSteps) * 100),
      data: { chapterIndex: i + 1, content },
    });
  }

  // ── 5. Build & save Markdown ───────────────────────────────────────────────
  const id = uuidv4();
  const ebook = { id, title, description, language: input.language, depthLevel: input.depthLevel, chapters, createdAt: new Date() };
  await emit({ step: 'export', message: 'Building Markdown file…', progress: 90 });
  const markdown = buildMarkdown(ebook);
  const mdPath = await saveMarkdown(markdown, title, id);
  completedSteps++;

  // ── 6. Convert to PDF ──────────────────────────────────────────────────────
  await emit({ step: 'export', message: 'Converting to PDF…', progress: 95 });
  let pdfPath: string | undefined;
  try {
    pdfPath = await convertToPdf(mdPath, title, id);
    completedSteps++;
    await emit({ step: 'export', message: 'PDF ready', progress: 99, data: { pdfPath } });
  } catch (err) {
    await emit({ step: 'export', message: `PDF conversion skipped: ${(err as Error).message}`, progress: 99 });
  }

  await emit({ step: 'done', message: 'eBook created successfully!', progress: 100, data: { id, mdPath, pdfPath } });

  return { ...ebook, mdPath, pdfPath };
}
