import * as fs from 'fs/promises';
import * as path from 'path';
import slugify from 'slugify';

export function getOutputDir(): string {
  return path.resolve(process.cwd(), 'output');
}

export function buildFilePath(title: string, id: string, ext: string): string {
  const slug = slugify(title, { lower: true, strict: true }).slice(0, 60);
  const shortId = id.split('-')[0];
  return path.join(getOutputDir(), `${slug}-${shortId}.${ext}`);
}

export async function saveMarkdown(content: string, title: string, id: string): Promise<string> {
  const outputDir = getOutputDir();
  await fs.mkdir(outputDir, { recursive: true });

  const filePath = buildFilePath(title, id, 'md');
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}
