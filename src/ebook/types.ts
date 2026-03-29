export type DepthLevel = 'básico' | 'intermediário' | 'avançado' | 'basic' | 'intermediate' | 'advanced';

export interface EbookInput {
  topic: string;
  language: string;
  chaptersCount: number;
  depthLevel: DepthLevel;
}

export interface ChapterMeta {
  title: string;
  description: string;
}

export interface Chapter {
  index: number;
  title: string;
  description: string;
  content: string;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  language: string;
  depthLevel: DepthLevel;
  chapters: Chapter[];
  createdAt: Date;
}

export interface EbookResult extends Ebook {
  mdPath: string;
  pdfPath?: string;
  epubPath?: string;
}

export type ProgressStep = 'title' | 'summary' | 'chapter' | 'export' | 'done' | 'error';

export interface ProgressEvent {
  step: ProgressStep;
  message: string;
  progress: number; // 0–100
  data?: unknown;
}

export type ProgressCallback = (event: ProgressEvent) => void | Promise<void>;
