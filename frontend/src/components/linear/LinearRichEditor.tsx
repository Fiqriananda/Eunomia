'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../ui/MarkdownRenderer';
import { Trash2, Maximize2, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WorkspaceMember } from '../../types';

interface LinearRichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onBlur?: () => void;
  taskId?: string;
  placeholder?: string;
  className?: string;
  onImageClick?: (url: string) => void;
  members?: WorkspaceMember[];
}

export function LinearRichEditor({
  value,
  onChange,
  onBlur,
  taskId,
  placeholder = 'Add description, requirements, bullet points, or context... (Paste images directly here)',
  className,
  onImageClick,
  members = [],
}: LinearRichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);
  const lastSerializedRef = useRef(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value?.trim());

  // Helper to convert HTML inside editor to Markdown
  const serializeToMarkdown = useCallback((): string => {
    if (!containerRef.current) return '';
    const container = containerRef.current;
    const lines: string[] = [];

    const nodes = Array.from(container.childNodes);

    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;

        // Image Card element
        if (el.hasAttribute('data-image-url')) {
          const url = el.getAttribute('data-image-url') || '';
          const alt = el.getAttribute('data-image-alt') || 'image';
          lines.push(`\n![${alt}](${url})\n`);
          continue;
        }

        // Child image inside wrapper
        const imgCard = el.querySelector('[data-image-url]');
        if (imgCard) {
          const url = imgCard.getAttribute('data-image-url') || '';
          const alt = imgCard.getAttribute('data-image-alt') || 'image';
          lines.push(`\n![${alt}](${url})\n`);
          continue;
        }

        // Uploading placeholder - ignore or retain
        if (el.hasAttribute('data-uploading')) {
          continue;
        }

        // Paragraphs or Divs
        const text = el.innerText || el.textContent || '';
        // If empty paragraph (just <br>)
        if (!text.trim() && el.querySelector('br')) {
          lines.push('');
        } else {
          lines.push(text);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim()) {
          lines.push(text);
        }
      }
    }

    // Clean up extra blank lines
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }, []);

  // Helper to convert Markdown to Editor HTML
  const markdownToHtml = useCallback((md: string): string => {
    if (!md || !md.trim()) {
      return '<p><br></p>';
    }

    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts: Array<{ type: 'text' | 'image'; content?: string; alt?: string; url?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(md)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: md.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'image', alt: match[1] || 'image', url: match[2] || '' });
      lastIndex = imgRegex.lastIndex;
    }

    if (lastIndex < md.length) {
      parts.push({ type: 'text', content: md.substring(lastIndex) });
    }

    let html = '';

    for (const part of parts) {
      if (part.type === 'image' && part.url) {
        const resolved = resolveMediaUrl(part.url);
        html += `
          <div class="linear-img-block my-3 select-none" data-image-url="${part.url}" data-image-alt="${part.alt}" contenteditable="false">
            <div class="group relative inline-block max-w-full rounded-xl overflow-hidden border border-border/80 bg-[#0c0d15] shadow-lg hover:border-primary/60 transition-all">
              <img src="${resolved}" alt="${part.alt}" class="max-h-[500px] max-w-full w-auto object-contain rounded-xl cursor-pointer transition-all duration-150 hover:brightness-105" data-action="zoom" />
              <div class="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-border/50 shadow-md">
                <button type="button" data-action="zoom" class="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="View Full Size">
                  <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </button>
                <button type="button" data-action="delete" class="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors" title="Delete Image">
                  <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        `;
      } else if (part.type === 'text' && part.content) {
        const rawLines = part.content.split('\n');
        for (const line of rawLines) {
          if (!line.trim()) {
            html += '<p><br></p>';
          } else {
            // Format links visually
            const withLinks = line.replace(
              /(https?:\/\/[^\s]+)/g,
              '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#818cf8] hover:underline">$1</a>',
            );
            html += `<p>${withLinks}</p>`;
          }
        }
      }
    }

    return html || '<p><br></p>';
  }, []);

  // Sync external value changes into contentEditable only if not actively typing
  useEffect(() => {
    if (!containerRef.current) return;
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const currentMd = serializeToMarkdown();
    if (value !== currentMd) {
      lastSerializedRef.current = value || '';
      containerRef.current.innerHTML = markdownToHtml(value || '');
      setIsEmpty(!value?.trim());
    }
  }, [value, markdownToHtml, serializeToMarkdown]);

  // Handle Input Changes
  const handleInput = () => {
    if (!containerRef.current) return;
    const md = serializeToMarkdown();
    lastSerializedRef.current = md;
    isInternalUpdateRef.current = true;
    setIsEmpty(!md.trim());
    onChange(md);
  };

  // Helper to create an image card DOM element
  const createImageCard = (url: string, alt: string, attachmentId?: string): HTMLElement => {
    const card = document.createElement('div');
    card.className = 'linear-img-block my-3 select-none outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl';
    card.setAttribute('data-image-url', url);
    card.setAttribute('data-image-alt', alt);
    if (attachmentId) {
      card.setAttribute('data-attachment-id', attachmentId);
    }
    card.setAttribute('tabindex', '0');
    card.contentEditable = 'false';

    const resolved = resolveMediaUrl(url);

    card.innerHTML = `
      <div class="group relative inline-block max-w-full rounded-xl overflow-hidden border border-border/80 bg-[#0c0d15] shadow-lg hover:border-primary/60 transition-all">
        <img src="${resolved}" alt="${alt}" class="max-h-[500px] max-w-full w-auto object-contain rounded-xl cursor-pointer transition-all duration-150 hover:brightness-105" data-action="zoom" />
        <div class="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-border/50 shadow-md">
          <button type="button" data-action="zoom" class="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="View Full Size">
            <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
          <button type="button" data-action="delete" class="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors" title="Delete Image">
            <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
    return card;
  };

  // Upload an image file and insert directly into the DOM
  const uploadAndInsertImage = async (file: File) => {
    if (!containerRef.current) return;
    setIsUploading(true);

    const ext = file.type.split('/')[1] || 'png';
    const cleanFileName = file.name && file.name !== 'image.png' ? file.name : `image-${Date.now()}.${ext}`;

    // Create placeholder element
    const placeholder = document.createElement('div');
    placeholder.className = 'my-3 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-2.5 text-indigo-300 text-xs animate-pulse select-none inline-flex max-w-full';
    placeholder.setAttribute('data-uploading', 'true');
    placeholder.contentEditable = 'false';
    placeholder.innerHTML = `
      <svg class="w-4 h-4 animate-spin text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>Uploading ${cleanFileName}...</span>
    `;

    // Insert at current cursor position
    const selection = window.getSelection();
    let inserted = false;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (containerRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(placeholder);

        // Add following empty paragraph so typing can continue
        const nextP = document.createElement('p');
        nextP.innerHTML = '<br>';
        placeholder.after(nextP);

        // Position cursor in next paragraph
        const newRange = document.createRange();
        newRange.setStart(nextP, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        inserted = true;
      }
    }

    if (!inserted) {
      containerRef.current.appendChild(placeholder);
      const nextP = document.createElement('p');
      nextP.innerHTML = '<br>';
      containerRef.current.appendChild(nextP);
    }

    handleInput();

    try {
      const res = await api.uploads.upload(file, taskId);
      const finalUrl = res.url;
      const finalCard = createImageCard(finalUrl, cleanFileName, res.id);

      placeholder.replaceWith(finalCard);
      handleInput();
    } catch (err: any) {
      console.error('Image upload failed:', err);
      placeholder.className = 'my-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 select-none';
      placeholder.innerHTML = `<span>Upload failed: ${err.message || 'Network error'}</span>`;
      handleInput();
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imgItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) {
        uploadAndInsertImage(file);
      }
      return;
    }

    // Normal text paste: insert plain text to avoid dirty HTML styles
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imgFile = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (imgFile) {
      e.preventDefault();
      uploadAndInsertImage(imgFile);
    }
  };

  // Handle Click on zoom or delete button inside image card
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check zoom action
    const zoomTarget = target.closest('[data-action="zoom"]');
    if (zoomTarget) {
      e.preventDefault();
      e.stopPropagation();
      const card = target.closest('[data-image-url]');
      const url = card?.getAttribute('data-image-url');
      if (url && onImageClick) {
        onImageClick(resolveMediaUrl(url));
      } else if (url) {
        window.open(resolveMediaUrl(url), '_blank');
      }
      return;
    }

    // Check delete action
    const deleteTarget = target.closest('[data-action="delete"]');
    if (deleteTarget) {
      e.preventDefault();
      e.stopPropagation();
      const card = target.closest('.linear-img-block') as HTMLElement;
      if (card) {
        const attId = card.getAttribute('data-attachment-id');
        if (attId) {
          api.uploads.delete(attId).catch((err) => console.warn('Could not delete attachment file:', err));
        }
        card.remove();
        handleInput();
      }
      return;
    }

    // Check link click
    const link = target.closest('a');
    if (link && link.href) {
      // If user clicks a link, allow navigating in new tab
      window.open(link.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.classList.contains('linear-img-block')) {
        e.preventDefault();
        const attId = activeEl.getAttribute('data-attachment-id');
        if (attId) {
          api.uploads.delete(attId).catch((err) => console.warn('Could not delete attachment file:', err));
        }
        activeEl.remove();
        handleInput();
      }
    }
  };

  return (
    <div className={cn('relative w-full group/editor', className)}>
      {/* Visual contentEditable document container */}
      <div
        ref={containerRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleClick}
        onBlur={onBlur}
        className={cn(
          'w-full min-h-[160px] text-sm text-zinc-200 outline-none leading-relaxed font-sans cursor-text py-1 transition-all',
          'selection:bg-indigo-500/30 selection:text-white',
        )}
      />

      {/* Placeholder overlay when editor is completely empty */}
      {isEmpty && (
        <div
          onClick={() => containerRef.current?.focus()}
          className="absolute top-1 left-0 text-sm text-zinc-500 pointer-events-none select-none flex items-center gap-1.5"
        >
          <span>{placeholder}</span>
        </div>
      )}

      {/* Subtle indicator bar at the bottom */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[11px] text-zinc-500 mt-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-zinc-400">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Paste images directly (⌘V) to embed inline</span>
          </span>
          {isUploading && (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium animate-pulse ml-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading image...</span>
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-600">
          Auto-saves
        </span>
      </div>
    </div>
  );
}
