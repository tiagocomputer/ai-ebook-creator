'use client';

import { CheckCircle2, Circle, Loader2, BookOpen, FileText, Wand2, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface ProgressItem {
  id: string;
  step: string;
  message: string;
  progress: number;
  status: 'active' | 'done';
  chapterTitle?: string;
  chapterIndex?: number;
}

interface Props {
  items: ProgressItem[];
}

function stepIcon(step: string, status: ProgressItem['status']) {
  const cls = 'w-4 h-4 flex-shrink-0';
  if (status === 'done') return <CheckCircle2 className={`${cls} text-green-400`} />;
  if (status === 'active') return <Loader2 className={`${cls} text-brand-400 animate-spin`} />;
  return <Circle className={`${cls} text-[#404060]`} />;
}

function stepColor(step: string): string {
  const map: Record<string, string> = {
    title: 'text-yellow-400',
    summary: 'text-blue-400',
    chapter: 'text-brand-400',
    export: 'text-purple-400',
    done: 'text-green-400',
  };
  return map[step] ?? 'text-[#a0a0b8]';
}

function stepBg(step: string): string {
  const map: Record<string, string> = {
    title: 'bg-yellow-400',
    summary: 'bg-blue-400',
    chapter: 'bg-brand-400',
    export: 'bg-purple-400',
    done: 'bg-green-400',
  };
  return map[step] ?? 'bg-[#a0a0b8]';
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function ProgressTracker({ items }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [items.length]);

  const overallProgress = items.length > 0
    ? Math.max(...items.map((i) => i.progress))
    : 0;

  const chapterItems = items.filter((i) => i.step === 'chapter');
  const nonChapterItems = items.filter((i) => i.step !== 'chapter');

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Overall progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#f0f0f8]">Generating your eBook…</span>
          <span className="text-xs font-mono text-brand-400">{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} />
      </div>

      {/* Non-chapter events */}
      <div className="space-y-1.5">
        {nonChapterItems.map((item) => (
          <div
            key={item.id}
            className={`progress-step ${item.status === 'active' ? 'progress-step-active' : item.status === 'done' ? 'progress-step-done' : ''}`}
          >
            {stepIcon(item.step, item.status)}
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium truncate ${item.status === 'done' ? 'text-[#9090b0]' : 'text-[#f0f0f8]'}`}>
                {item.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chapters grid */}
      {chapterItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#7070a0] uppercase tracking-wider mb-3">
            Chapters ({chapterItems.filter(i => i.status === 'done').length}/{chapterItems.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {chapterItems.map((item) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border text-xs transition-all duration-300 ${
                  item.status === 'active'
                    ? 'border-brand-500/30 bg-brand-500/10'
                    : item.status === 'done'
                    ? 'border-green-500/15 bg-green-500/5'
                    : 'border-white/5 bg-white/2'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {item.status === 'done' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                  ) : item.status === 'active' ? (
                    <Loader2 className="w-3 h-3 text-brand-400 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-[#404060] flex-shrink-0" />
                  )}
                  <span className="text-[10px] font-medium text-[#7070a0]">
                    Ch. {item.chapterIndex}
                  </span>
                </div>
                <p className={`truncate leading-tight ${item.status === 'done' ? 'text-[#9090b0]' : 'text-[#d0d0e8]'}`}>
                  {item.chapterTitle ?? item.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
