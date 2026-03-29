import { Ebook } from './types';

export function buildMarkdown(ebook: Ebook): string {
  const lines: string[] = [];

  // Front matter / title page
  lines.push(`# ${ebook.title}`);
  lines.push('');
  lines.push(`*${ebook.description}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  ebook.chapters.forEach((ch, i) => {
    lines.push(`${i + 1}. [${ch.title}](#chapter-${i + 1})`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');

  // Chapters
  ebook.chapters.forEach((ch, i) => {
    lines.push(`## Chapter ${i + 1}: ${ch.title}`);
    lines.push('');
    if (ch.description) {
      lines.push(`> ${ch.description}`);
      lines.push('');
    }
    lines.push(ch.content.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  // Footer
  lines.push(`*Generated with AI eBook Creator — ${new Date(ebook.createdAt).toLocaleDateString()}*`);
  lines.push('');

  return lines.join('\n');
}
