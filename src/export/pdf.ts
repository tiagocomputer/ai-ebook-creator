import * as fs from 'fs/promises';
import * as path from 'path';
import { marked } from 'marked';
import { buildFilePath, getOutputDir } from './markdown';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #1a1a2e;
    background: #ffffff;
    padding: 60px 80px;
    max-width: 780px;
    margin: auto;
  }

  h1 {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 28pt;
    font-weight: 700;
    color: #0f0f23;
    margin-bottom: 16px;
    line-height: 1.2;
    border-bottom: 3px solid #6c63ff;
    padding-bottom: 16px;
  }

  h2 {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 18pt;
    font-weight: 700;
    color: #16213e;
    margin-top: 40px;
    margin-bottom: 12px;
    padding-left: 12px;
    border-left: 4px solid #6c63ff;
  }

  h3 {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 13pt;
    font-weight: 600;
    color: #16213e;
    margin-top: 28px;
    margin-bottom: 8px;
  }

  p { margin-bottom: 12px; text-align: justify; }

  blockquote {
    border-left: 3px solid #6c63ff;
    background: #f3f2ff;
    padding: 12px 20px;
    margin: 16px 0;
    font-style: italic;
    color: #444;
    border-radius: 0 6px 6px 0;
  }

  ul, ol {
    margin: 12px 0 12px 28px;
  }

  li { margin-bottom: 6px; }

  code {
    font-family: 'Fira Code', 'Courier New', monospace;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9.5pt;
    color: #c7254e;
  }

  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    font-size: 9pt;
    line-height: 1.6;
  }

  pre code {
    background: none;
    padding: 0;
    color: inherit;
  }

  hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 40px 0;
  }

  em { color: #444; }

  strong { color: #0f0f23; }

  @media print {
    h2 { page-break-before: always; }
    h2:first-of-type { page-break-before: avoid; }
  }
`;

export async function convertToPdf(
  mdPath: string,
  title: string,
  id: string,
): Promise<string> {
  const mdContent = await fs.readFile(mdPath, 'utf-8');
  const htmlBody = await marked(mdContent);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>${htmlBody}</body>
</html>`;

  const outputDir = getOutputDir();
  await fs.mkdir(outputDir, { recursive: true });

  const htmlPath = buildFilePath(title, id, 'html');
  await fs.writeFile(htmlPath, html, 'utf-8');

  const pdfPath = buildFilePath(title, id, 'pdf');

  // Try puppeteer first
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    await browser.close();
    // clean up html
    await fs.unlink(htmlPath).catch(() => undefined);
    return pdfPath;
  } catch {
    // fallback: return html path if puppeteer fails
    await fs.rename(htmlPath, pdfPath.replace('.pdf', '.html')).catch(() => undefined);
    throw new Error('Puppeteer unavailable. Install it with: npm install puppeteer');
  }
}

export async function convertToEpub(
  mdPath: string,
  title: string,
  id: string,
): Promise<string> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const outputDir = getOutputDir();
  await fs.mkdir(outputDir, { recursive: true });

  const epubPath = buildFilePath(title, id, 'epub');

  await execFileAsync('pandoc', [
    mdPath,
    '-o', epubPath,
    '--epub-cover-image', path.resolve(__dirname, '../../web/public/cover-placeholder.jpg'),
    '--metadata', `title="${title}"`,
    '--toc',
  ]);

  return epubPath;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
