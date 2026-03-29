import { EbookInput } from '../../ebook/types';

export function buildSummaryPrompt(
  title: string,
  { topic, language, chaptersCount, depthLevel }: EbookInput,
): string {
  return `You are an expert instructional designer creating a structured eBook outline.

Create a detailed table of contents for an eBook with the following details:

Title: "${title}"
Topic: ${topic}
Language: ${language}
Depth level: ${depthLevel}
Number of chapters: ${chaptersCount}

Requirements:
- Each chapter must have a clear, descriptive title and a brief description (1–2 sentences) of what it covers
- The chapters must flow logically, building knowledge progressively
- The outline must match the depth level: ${depthLevel}
- All text in the response must be in ${language}

Return a valid JSON array with EXACTLY ${chaptersCount} items.
Each item must have this exact structure:
[
  {
    "title": "Chapter title here",
    "description": "Brief description of what this chapter covers"
  }
]

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;
}
