'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';

export interface FormValues {
  topic: string;
  language: string;
  chaptersCount: number;
  depthLevel: string;
}

interface Props {
  onSubmit: (values: FormValues) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'pt-BR', label: '🇧🇷 Português (BR)' },
  { value: 'es-ES', label: '🇪🇸 Español' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
  { value: 'de-DE', label: '🇩🇪 Deutsch' },
  { value: 'it-IT', label: '🇮🇹 Italiano' },
  { value: 'ja-JP', label: '🇯🇵 日本語' },
  { value: 'zh-CN', label: '🇨🇳 中文 (简体)' },
];

const DEPTH_LEVELS = [
  { value: 'basic', label: 'Basic', desc: 'Beginner-friendly, no prior knowledge needed' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some familiarity with the topic' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep dive for experienced readers' },
];

const CHAPTER_OPTIONS = [3, 5, 7, 8, 10, 12, 15];

export default function EbookForm({ onSubmit, disabled }: Props) {
  const [values, setValues] = useState<FormValues>({
    topic: '',
    language: 'en-US',
    chaptersCount: 8,
    depthLevel: 'intermediate',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.topic.trim()) return;
    onSubmit(values);
  };

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Topic */}
      <div>
        <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">
          Topic / Theme <span className="text-brand-400">*</span>
        </label>
        <textarea
          value={values.topic}
          onChange={(e) => set('topic', e.target.value)}
          placeholder="e.g. Personal finance for beginners, Introduction to Machine Learning, Mindfulness at work…"
          rows={3}
          required
          disabled={disabled}
          className="input-field resize-none"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">Language</label>
        <div className="relative">
          <select
            value={values.language}
            onChange={(e) => set('language', e.target.value)}
            disabled={disabled}
            className="input-field appearance-none pr-9 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78] pointer-events-none" />
        </div>
      </div>

      {/* Chapters */}
      <div>
        <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">
          Number of chapters
        </label>
        <div className="flex flex-wrap gap-2">
          {CHAPTER_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => set('chaptersCount', n)}
              className={`w-11 h-9 rounded-lg text-sm font-medium transition-all duration-150 ${
                values.chaptersCount === n
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-white/5 text-[#a0a0b8] hover:bg-white/10 border border-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Depth level */}
      <div>
        <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">Depth level</label>
        <div className="space-y-2">
          {DEPTH_LEVELS.map((d) => (
            <label
              key={d.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                values.depthLevel === d.value
                  ? 'border-brand-500/40 bg-brand-500/10'
                  : 'border-white/10 bg-white/3 hover:border-white/20'
              } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="depth"
                value={d.value}
                checked={values.depthLevel === d.value}
                onChange={() => set('depthLevel', d.value)}
                className="mt-0.5 accent-brand-500"
                disabled={disabled}
              />
              <div>
                <div className="text-sm font-medium text-[#f0f0f8]">{d.label}</div>
                <div className="text-xs text-[#7070a0]">{d.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={disabled || !values.topic.trim()} className="btn-primary w-full mt-2">
        {disabled ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate eBook
          </>
        )}
      </button>
    </form>
  );
}
