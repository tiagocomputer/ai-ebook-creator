import { EbookInput } from '../../ebook/types';

export function buildTitlePrompt({ topic, language, depthLevel }: EbookInput): string {
  return `You are an expert content strategist and copywriter.

Create an engaging, compelling, and marketable eBook title for the following topic.
The title should be catchy, clear, and reflect the depth level of the content.

Topic: ${topic}
Language: ${language}
Depth level: ${depthLevel}

Rules:
- Return ONLY the title text, nothing else
- No quotes, no explanation
- Maximum 12 words
- Language of the response: ${language}
- Make it sound professional and appealing to the target audience`;
}

export function buildDescriptionPrompt(
  title: string,
  { topic, language, depthLevel }: EbookInput,
): string {
  return `You are an expert content strategist.

Write a compelling back-cover description for an eBook with the following details:

Title: "${title}"
Topic: ${topic}
Language: ${language}
Depth level: ${depthLevel}

Rules:
- Return ONLY the description text, nothing else
- 2–4 paragraphs
- Highlight key benefits and what the reader will learn
- Language of the response: ${language}
- Engaging and professional tone`;
}
