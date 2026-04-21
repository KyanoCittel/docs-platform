'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';

type Category = { id: string; name: string };
type Doc = {
  title: string;
  content: string;
  category_id: string | null;
  published: boolean;
};

const BUCKET = 'docs-images';

export default function DocEditor({
  categories,
  doc,
}: {
  categories: Category[];
  doc?: Doc;
}) {
  const [title, setTitle] = useState(doc?.title ?? '');
  const [content, setContent] = useState(doc?.content ?? '');
  const [preview, setPreview] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function runAi() {
    setAiError(null);
    setAiResult(null);
    if (!content.trim()) {
      setAiError('Schrijf eerst iets in het inhoudsveld.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? 'AI fout');
      } else {
        setAiResult(data.content);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Netwerkfout');
    } finally {
      setAiLoading(false);
    }
  }

  function acceptAi() {
    if (aiResult !== null) setContent(aiResult);
    setAiResult(null);
  }

  function rejectAi() {
    setAiResult(null);
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((c) => c + text);
      return;
    }
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || file.type.split('/')[1] || 'png').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleFiles(files: FileList | File[]) {
    setUploadError(null);
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    setUploading(true);
    try {
      for (const file of images) {
        const url = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]+$/, '') || 'afbeelding';
        insertAtCursor(`\n\n![${alt}](${url})\n\n`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload mislukt');
    } finally {
      setUploading(false);
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    await handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categorie</label>
          <select
            name="category_id"
            defaultValue={doc?.category_id ?? ''}
            className="w-full border rounded-md px-3 py-2 bg-white"
          >
            <option value="">— geen —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" name="published" defaultChecked={doc?.published ?? true} />
          <span className="text-sm">Gepubliceerd</span>
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1 gap-2">
          <label className="text-sm font-medium">Inhoud (Markdown)</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 disabled:opacity-50"
              title="Foto toevoegen (of plak direct met Ctrl+V)"
            >
              {uploading ? 'Uploaden...' : '📷 Foto'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={runAi}
              disabled={aiLoading || aiResult !== null}
              className="text-xs px-2 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              title="Laat AI de tekst netjes in Markdown zetten"
            >
              {aiLoading ? 'AI bezig...' : '✨ AI verbeteren'}
            </button>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-gray-600 hover:text-black"
            >
              {preview ? 'Bewerken' : 'Voorbeeld'}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Upload fout: {uploadError}
          </div>
        )}
        {aiError && (
          <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {aiError}
          </div>
        )}

        {aiResult !== null ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Huidig</div>
                <div className="min-h-[300px] max-h-[500px] overflow-auto border rounded-md px-3 py-2 bg-white whitespace-pre-wrap text-sm font-mono">
                  {content}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">AI voorstel</div>
                <div className="min-h-[300px] max-h-[500px] overflow-auto border-2 border-purple-300 rounded-md px-3 py-2 bg-purple-50 prose max-w-none prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={rejectAi}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Afwijzen
              </button>
              <button
                type="button"
                onClick={acceptAi}
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              >
                Accepteren
              </button>
            </div>
          </div>
        ) : preview ? (
          <div className="min-h-[300px] border rounded-md px-3 py-2 bg-white prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            rows={18}
            placeholder="Schrijf hier je uitleg. Plak een foto met Ctrl+V of sleep hem erin. Klik daarna op 'AI verbeteren' om het netjes in Markdown te zetten."
            className="w-full border rounded-md px-3 py-2 bg-white font-mono text-sm"
          />
        )}

        <input type="hidden" name="content" value={content} />
      </div>
    </div>
  );
}
