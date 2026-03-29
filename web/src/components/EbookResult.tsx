'use client';

import { Download, BookOpen, FileText, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import ProgressTracker, { ProgressItem } from './ProgressTracker';

interface DoneData {
  id: string;
  title: string;
  description: string;
  chaptersCount: number;
  downloadPdf: string | null;
  downloadMd: string;
}

interface Props {
  data: DoneData;
  progressItems: ProgressItem[];
  apiUrl: string;
  onReset: () => void;
}

export default function EbookResult({ data, progressItems, apiUrl, onReset }: Props) {
  return (
    <div className="space-y-4">
      {/* Success banner */}
      <div className="glass-card p-5 border-green-500/20 bg-green-500/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
              eBook Ready
            </p>
            <h2 className="text-lg font-bold text-[#f0f0f8] leading-tight mb-1">{data.title}</h2>
            <p className="text-xs text-[#7070a0]">{data.chaptersCount} chapters generated</p>
          </div>
          <button
            onClick={onReset}
            className="btn-secondary px-3 py-2 text-xs flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New eBook
          </button>
        </div>
      </div>

      {/* Description preview */}
      {data.description && (
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-[#7070a0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Book Description
          </p>
          <p className="text-sm text-[#b0b0c8] leading-relaxed line-clamp-4">{data.description}</p>
        </div>
      )}

      {/* Downloads */}
      <div className="glass-card p-5">
        <p className="text-xs font-semibold text-[#7070a0] uppercase tracking-wider mb-4">
          Download
        </p>
        <div className="space-y-2.5">
          {data.downloadPdf && (
            <a
              href={`${apiUrl}${data.downloadPdf}`}
              download
              className="btn-primary w-full"
            >
              <BookOpen className="w-4 h-4" />
              Download PDF
              <Download className="w-3.5 h-3.5 ml-auto" />
            </a>
          )}
          <a
            href={`${apiUrl}${data.downloadMd}`}
            download
            className="btn-secondary w-full"
          >
            <FileText className="w-4 h-4" />
            Download Markdown
            <Download className="w-3.5 h-3.5 ml-auto" />
          </a>
        </div>
      </div>

      {/* Collapsible progress log */}
      <details className="glass-card overflow-hidden">
        <summary className="px-5 py-4 text-xs font-semibold text-[#7070a0] uppercase tracking-wider cursor-pointer select-none hover:text-[#a0a0b8] transition-colors list-none flex items-center justify-between">
          <span>Generation log</span>
          <span className="text-brand-400">{progressItems.length} events</span>
        </summary>
        <div className="px-5 pb-5 border-t border-white/5">
          <ProgressTracker items={progressItems} />
        </div>
      </details>
    </div>
  );
}
