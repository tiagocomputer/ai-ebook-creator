import express, { Request, Response } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createEbook } from './ebook/createEbook';
import { EbookInput, DepthLevel } from './ebook/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// SSE progress stream + generation endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const { topic, language = 'en-US', chaptersCount = 8, depthLevel = 'intermediate' } =
    req.body as Partial<EbookInput>;

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: 'topic is required' });
    return;
  }

  // Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await createEbook(
      {
        topic,
        language,
        chaptersCount: Number(chaptersCount),
        depthLevel: depthLevel as DepthLevel,
      },
      async (event) => {
        send(event);
      },
    );

    send({
      step: 'done',
      message: 'eBook complete',
      progress: 100,
      data: {
        id: result.id,
        title: result.title,
        description: result.description,
        chaptersCount: result.chapters.length,
        mdPath: result.mdPath,
        pdfPath: result.pdfPath,
        downloadPdf: result.pdfPath ? `/api/download/${result.id}/pdf` : null,
        downloadMd: `/api/download/${result.id}/md`,
      },
    });
  } catch (err) {
    send({ step: 'error', message: (err as Error).message, progress: 0 });
  } finally {
    res.end();
  }
});

// Download endpoint
app.get('/api/download/:id/:format', (req: Request, res: Response) => {
  const { id, format } = req.params;
  const outputDir = path.resolve(process.cwd(), 'output');

  if (!fs.existsSync(outputDir)) {
    res.status(404).json({ error: 'Output directory not found' });
    return;
  }

  const files = fs.readdirSync(outputDir);
  const shortId = id.split('-')[0];
  const ext = format === 'pdf' ? '.pdf' : '.md';
  const file = files.find((f) => f.includes(shortId) && f.endsWith(ext));

  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const filePath = path.join(outputDir, file);
  const mimeType = ext === '.pdf' ? 'application/pdf' : 'text/markdown';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
  fs.createReadStream(filePath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`AI eBook Creator API running at http://localhost:${PORT}`);
});

export default app;
