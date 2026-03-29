'use client';

import { useState } from 'react';
import { BookOpen, Sparkles, Zap, Download, Github } from 'lucide-react';
import EbookForm, { FormValues } from '@/components/EbookForm';
import ProgressTracker, { ProgressItem } from '@/components/ProgressTracker';
import EbookResult from '@/components/EbookResult';

type AppState = 'idle' | 'generating' | 'done' | 'error';

interface DoneData {
  id: string;
  title: string;
  description: string;
  chaptersCount: number;
  downloadPdf: string | null;
  downloadMd: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [doneData, setDoneData] = useState<DoneData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const addProgress = (item: ProgressItem) => {
    setProgressItems((prev) => {
      const existing = prev.findIndex((p) => p.id === item.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = item;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleGenerate = async (values: FormValues) => {
    setState('generating');
    setProgressItems([]);
    setDoneData(null);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: values.topic,
          language: values.language,
          chaptersCount: Number(values.chaptersCount),
          depthLevel: values.depthLevel,
        }),
      });

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.step === 'error') {
              setErrorMsg(event.message);
              setState('error');
              return;
            }

            if (event.step === 'done' && event.data?.id) {
              setDoneData(event.data as DoneData);
              setState('done');
              return;
            }

            // Map event to progress item
            const progressId = event.step === 'chapter'
              ? `chapter-${event.data?.chapterIndex ?? 0}`
              : event.step;

            addProgress({
              id: progressId,
              step: event.step,
              message: event.message,
              progress: event.progress,
              status: event.progress === 100 || event.step === 'done' ? 'done' : 'active',
              chapterTitle: event.step === 'chapter' ? event.data?.title : undefined,
              chapterIndex: event.step === 'chapter' ? event.data?.chapterIndex : undefined,
            });
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setProgressItems([]);
    setDoneData(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a0f]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500/20">
              <BookOpen className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-semibold text-[#f0f0f8]">AI eBook Creator</span>
          </div>
          <a
            href="https://github.com/tiagocomputer/ai-ebook-creator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#a0a0b8] hover:text-[#f0f0f8] transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:block">GitHub</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by GPT-4o &amp; Claude
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-[1.1]">
            Generate complete{' '}
            <span className="gradient-text">eBooks with AI</span>
          </h1>
          <p className="text-lg text-[#a0a0b8] max-w-2xl mx-auto leading-relaxed">
            Enter a topic, choose your settings, and let AI write a full, professional eBook —
            title, outline, every chapter — exported to PDF in minutes.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {[
              { icon: Zap, label: 'AI-powered chapters' },
              { icon: BookOpen, label: 'PDF & Markdown export' },
              { icon: Download, label: 'Instant download' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#a0a0b8] text-xs"
              >
                <Icon className="w-3.5 h-3.5 text-brand-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left column: Form */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-[#a0a0b8] uppercase tracking-widest mb-5">
                Configure your eBook
              </h2>
              <EbookForm
                onSubmit={handleGenerate}
                disabled={state === 'generating'}
              />
            </div>
          </div>

          {/* Right column: Progress / Result */}
          <div className="lg:col-span-3">
            {state === 'idle' && (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-5">
                  <BookOpen className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#f0f0f8] mb-2">
                  Ready to create your eBook
                </h3>
                <p className="text-sm text-[#7070a0] max-w-xs">
                  Fill in the form and click &quot;Generate eBook&quot; to start the AI writing
                  your book in real-time.
                </p>
              </div>
            )}

            {(state === 'generating' || (state === 'done' && progressItems.length > 0 && !doneData)) && (
              <ProgressTracker items={progressItems} />
            )}

            {state === 'done' && doneData && (
              <EbookResult
                data={doneData}
                progressItems={progressItems}
                apiUrl={API_URL}
                onReset={handleReset}
              />
            )}

            {state === 'error' && (
              <div className="glass-card p-8">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Generation failed</h3>
                  <p className="text-sm text-[#7070a0] mb-6 max-w-sm mx-auto">{errorMsg}</p>
                  <button onClick={handleReset} className="btn-secondary">
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-24 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-[#5050708]">
          <p className="text-[#505070]">
            AI eBook Creator — Built with Next.js, TypeScript &amp; OpenAI/Claude
          </p>
        </div>
      </footer>
    </div>
  );
}
