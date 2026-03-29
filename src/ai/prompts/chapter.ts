import { ChapterMeta, EbookInput } from '../../ebook/types';

export function buildChapterPrompt(
  ebookTitle: string,
  chapter: ChapterMeta,
  chapterIndex: number,
  totalChapters: number,
  input: EbookInput,
): string {
  const wordTarget = depthToWordCount(input.depthLevel);

  return `You are an expert author writing a chapter for a professional eBook.

eBook Title: "${ebookTitle}"
Chapter ${chapterIndex} of ${totalChapters}: "${chapter.title}"
Chapter Description: ${chapter.description}

Writing specifications:
- Language: ${input.language}
- Depth level: ${input.depthLevel}
- Target word count: ~${wordTarget} words
- Topic context: ${input.topic}

Writing style guidelines:
- Clear, engaging, and didactic prose
- Use concrete examples and practical scenarios
- Include subheadings (##) to structure the content
- Use bullet points or numbered lists where appropriate
- Define technical terms when first introduced
- Write in an authoritative yet accessible tone
- Connect concepts to real-world applications

Structure the chapter with:
1. A brief introduction paragraph
2. Main content with 3–5 subheadings
3. Practical examples or case studies
4. A concise summary/key takeaways section

Return ONLY the chapter content in Markdown format.
Do NOT include the chapter title (it will be added automatically).
Do NOT include any preamble or explanation.`;
}

function depthToWordCount(level: EbookInput['depthLevel']): number {
  const map: Record<EbookInput['depthLevel'], number> = {
    básico: 600,
    basic: 600,
    intermediário: 900,
    intermediate: 900,
    avançado: 1300,
    advanced: 1300,
  };
  return map[level] ?? 800;
}
