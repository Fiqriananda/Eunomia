'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../ui/MarkdownRenderer';
import {
  Code,
  List,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Heading3,
  Link as LinkIcon,
  Quote,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
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

/**
 * Converts Markdown string into styled HTML for live WYSIWYG
 */
function markdownToHtml(md: string, membersList: WorkspaceMember[] = []): string {
  if (!md || !md.trim()) return '';

  // 1. Normalize multi-line image tags where ] and ( are separated by newlines
  let normalized = md.replace(
    /!\[([\s\S]*?)\]\s*\(([\s\S]*?)\)/g,
    (_, alt, url) => {
      const cleanAlt = alt.trim().replace(/\n+/g, ' ');
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `\n\n![${cleanAlt}](${cleanUrl})\n\n`;
    },
  );

  const lines = normalized.split('\n');
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeBlockLang = '';
  let inList = false;
  let inOrderedList = false;

  const closeList = () => {
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    if (inOrderedList) {
      htmlLines.push('</ol>');
      inOrderedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks: ``` or ```javascript
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        htmlLines.push(
          `<div class="code-block-container my-3 rounded-lg overflow-hidden border border-border/60 bg-[#12131d]" data-lang="${codeBlockLang}">` +
            `<div class="px-3 py-1 bg-[#181926] text-[10px] text-zinc-400 font-mono flex items-center justify-between border-b border-border/40 select-none">` +
              `<span>${codeBlockLang || 'code'}</span>` +
            `</div>` +
            `<pre class="p-3 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed"><code>${escapeHtml(
              codeBuffer.join('\n'),
            )}</code></pre>` +
          `</div>`,
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        closeList();
        inCodeBlock = true;
        const matchLang = trimmed.slice(3).trim();
        codeBlockLang = matchLang || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      closeList();
      htmlLines.push('<hr class="my-4 border-t border-border/60" />');
      continue;
    }

    // Headings: # to ######
    if (trimmed.startsWith('###### ')) {
      closeList();
      htmlLines.push(
        `<h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-3 mb-1">${formatInline(
          trimmed.slice(7),
          membersList,
        )}</h6>`,
      );
      continue;
    }
    if (trimmed.startsWith('##### ')) {
      closeList();
      htmlLines.push(
        `<h5 class="text-xs font-semibold text-zinc-300 mt-3 mb-1">${formatInline(
          trimmed.slice(6),
          membersList,
        )}</h5>`,
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      closeList();
      htmlLines.push(
        `<h4 class="text-sm font-semibold text-zinc-100 mt-3.5 mb-1.5">${formatInline(
          trimmed.slice(5),
          membersList,
        )}</h4>`,
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      closeList();
      htmlLines.push(
        `<h3 class="text-base font-semibold text-zinc-100 mt-3 mb-1">${formatInline(
          trimmed.slice(4),
          membersList,
        )}</h3>`,
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeList();
      htmlLines.push(
        `<h2 class="text-lg font-bold text-zinc-100 mt-3.5 mb-1.5">${formatInline(
          trimmed.slice(3),
          membersList,
        )}</h2>`,
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeList();
      htmlLines.push(
        `<h1 class="text-xl font-bold text-zinc-100 mt-4 mb-2 pb-1 border-b border-border/40">${formatInline(
          trimmed.slice(2),
          membersList,
        )}</h1>`,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      closeList();
      htmlLines.push(
        `<blockquote class="border-l-2 border-indigo-500/60 pl-3 my-2 text-zinc-400 italic">${formatInline(
          trimmed.slice(2),
          membersList,
        )}</blockquote>`,
      );
      continue;
    }

    // Checklists: - [ ] or - [x]
    const checklistMatch = trimmed.match(/^[-*+]\s*\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      closeList();
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      const label = checklistMatch[2];
      const isIndented = /^\s{2,}/.test(rawLine);
      htmlLines.push(
        `<div class="task-checkbox-item flex items-start gap-2 my-1.5 ${isIndented ? 'ml-5' : ''}" data-checked="${isChecked}">` +
          `<input type="checkbox" ${
            isChecked ? 'checked' : ''
          } class="w-4 h-4 mt-0.5 rounded accent-indigo-500 cursor-pointer shrink-0" />` +
          `<span class="task-label ${
            isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'
          }">${formatInline(label, membersList)}</span>` +
          `</div>`,
      );
      continue;
    }

    // Bullet lists: - or * or +
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (inOrderedList) closeList();
      if (!inList) {
        htmlLines.push('<ul class="list-disc list-inside space-y-1 my-1.5">');
        inList = true;
      }
      const isIndented = /^\s{2,}/.test(rawLine);
      htmlLines.push(
        `<li class="${isIndented ? 'ml-5 list-circle' : ''}">${formatInline(
          ulMatch[1],
          membersList,
        )}</li>`,
      );
      continue;
    }

    // Ordered lists: 1. 2. etc.
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inList) closeList();
      if (!inOrderedList) {
        htmlLines.push('<ol class="list-decimal list-inside space-y-1 my-1.5">');
        inOrderedList = true;
      }
      htmlLines.push(`<li>${formatInline(olMatch[2], membersList)}</li>`);
      continue;
    }

    // Images: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      closeList();
      const rawUrl = imgMatch[2].trim();
      const resolvedUrl = resolveMediaUrl(rawUrl);
      const altText = escapeHtml(imgMatch[1] || 'image');
      htmlLines.push(
        `<div class="editor-image-card group relative inline-block my-3 max-w-full rounded-lg overflow-hidden border border-border/50 bg-[#161722] shadow-md select-none" contenteditable="false" data-image-url="${rawUrl}">` +
          `<img src="${resolvedUrl}" alt="${altText}" class="max-h-96 rounded-lg object-contain block hover:opacity-95 transition-opacity" />` +
          `<div class="image-actions absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/10 shadow-lg">` +
            `<button type="button" class="btn-preview-img p-1 text-zinc-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer" title="Preview image">` +
              `<svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>` +
            `</button>` +
            `<button type="button" class="btn-delete-img p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/20 transition-colors cursor-pointer" title="Delete image">` +
              `<svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>` +
            `</button>` +
          `</div>` +
        `</div><p><br></p>`,
      );
      continue;
    }

    closeList();

    if (!trimmed) {
      htmlLines.push('<p><br></p>');
    } else {
      htmlLines.push(
        `<p class="my-1 text-sm leading-relaxed text-zinc-200">${formatInline(
          trimmed,
          membersList,
        )}</p>`,
      );
    }
  }

  if (inCodeBlock) {
    htmlLines.push(
      `<div class="code-block-container my-3 rounded-lg overflow-hidden border border-border/60 bg-[#12131d]" data-lang="${codeBlockLang}">` +
        `<div class="px-3 py-1 bg-[#181926] text-[10px] text-zinc-400 font-mono flex items-center justify-between border-b border-border/40 select-none">` +
          `<span>${codeBlockLang || 'code'}</span>` +
        `</div>` +
        `<pre class="p-3 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed"><code>${escapeHtml(
          codeBuffer.join('\n'),
        )}</code></pre>` +
      `</div>`,
    );
  }

  closeList();
  return htmlLines.join('');
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats inline Markdown into HTML elements
 */
function formatInline(text: string, membersList: WorkspaceMember[] = []): string {
  let res = escapeHtml(text);

  // Match team member names first (longest names first) for accurate multi-word mentions
  const sortedMembers = [...membersList].sort(
    (a, b) => (b.user?.name?.length || 0) - (a.user?.name?.length || 0),
  );
  for (const m of sortedMembers) {
    if (m.user?.name) {
      const name = m.user.name;
      const escapedName = escapeHtml(name);
      const mentionRegex = new RegExp(
        `@${escapedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s.,!?:;])`,
        'gi',
      );
      res = res.replace(
        mentionRegex,
        `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 select-none" contenteditable="false" data-mention="${escapedName}">@${escapedName}</span>`,
      );
    }
  }

  // Generic @mentions (e.g. @SarahConnor or @Sarah Connor)
  res = res.replace(
    /@([A-Za-z0-9_\-\.]+(?:\s+[A-Za-z0-9_\-\.]+)?)/g,
    (match, name) => {
      if (match.includes('data-mention') || match.includes('<span')) return match;
      return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 select-none" contenteditable="false" data-mention="${name}">@${name}</span>`;
    },
  );

  // Bold & Italic: ***text***
  res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // CriticMarkup / Insert / Highlight: ++text++
  res = res.replace(
    /\+\+([^+]+)\+\+/g,
    '<strong class="text-zinc-100 font-semibold">$1</strong>',
  );
  // Italic: *text*
  res = res.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  // Strikethrough: ~~text~~
  res = res.replace(
    /~~(.*?)~~/g,
    '<del class="line-through text-zinc-500">$1</del>',
  );
  // Underline: <u>text</u>
  res = res.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u class="underline">$1</u>');
  res = res.replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>');
  // Inline Code: `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-[#181926] text-indigo-300 font-mono text-xs border border-border/40">$1</code>',
  );
  // Links: [text](url)
  res = res.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 underline hover:text-indigo-300">$1</a>',
  );

  return res;
}

/**
 * Converts DOM tree inside contentEditable back into clean Markdown string
 */
function htmlToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Handle special block components directly before generic child mapping
  if (el.classList.contains('code-block-container')) {
    const lang = el.getAttribute('data-lang') || '';
    const codeText = el.querySelector('code')?.textContent || el.textContent || '';
    return `\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
  }

  if (el.classList.contains('editor-image-card')) {
    const img = el.querySelector('img');
    if (img) {
      const src = img.getAttribute('src') || el.getAttribute('data-image-url') || '';
      const alt = img.getAttribute('alt') || 'image';
      return `\n![${alt}](${src})\n\n`;
    }
    return '';
  }

  if (el.classList.contains('task-checkbox-item')) {
    const input = el.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null;
    const isChecked =
      input?.checked || el.getAttribute('data-checked') === 'true';
    const labelEl = el.querySelector('.task-label');
    const labelMd = labelEl
      ? Array.from(labelEl.childNodes).map(htmlToMarkdown).join('').trim()
      : (el.textContent || '').trim();
    const isIndented = el.classList.contains('ml-5');
    const prefix = isIndented ? '  ' : '';
    return `${prefix}- [${isChecked ? 'x' : ' '}] ${labelMd}\n`;
  }

  const childrenMd = Array.from(el.childNodes).map(htmlToMarkdown).join('');

  switch (tag) {
    case 'h1':
      return `\n# ${childrenMd.trim()}\n\n`;
    case 'h2':
      return `\n## ${childrenMd.trim()}\n\n`;
    case 'h3':
      return `\n### ${childrenMd.trim()}\n\n`;
    case 'h4':
      return `\n#### ${childrenMd.trim()}\n\n`;
    case 'h5':
      return `\n##### ${childrenMd.trim()}\n\n`;
    case 'h6':
      return `\n###### ${childrenMd.trim()}\n\n`;
    case 'hr':
      return `\n---\n\n`;
    case 'b':
    case 'strong':
      return `**${childrenMd}**`;
    case 'i':
    case 'em':
      return `*${childrenMd}*`;
    case 's':
    case 'del':
    case 'strike':
      return `~~${childrenMd}~~`;
    case 'u':
      return `<u>${childrenMd}</u>`;
    case 'code':
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        return childrenMd;
      }
      return `\`${childrenMd}\``;
    case 'pre': {
      const codeEl = el.querySelector('code');
      const lang =
        el.getAttribute('data-lang') ||
        el.closest('.code-block-container')?.getAttribute('data-lang') ||
        '';
      const text = (codeEl ? codeEl.textContent : el.textContent) || childrenMd;
      return `\n\`\`\`${lang}\n${text.trim()}\n\`\`\`\n\n`;
    }
    case 'blockquote':
      return `\n> ${childrenMd.trim()}\n\n`;
    case 'a':
      return `[${childrenMd}](${el.getAttribute('href') || ''})`;
    case 'img': {
      if (el.closest('.editor-image-card')) {
        return '';
      }
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || 'image';
      return `\n![${alt}](${src})\n\n`;
    }
    case 'span':
      if (
        el.getAttribute('data-mention') ||
        el.classList.contains('mention-badge')
      ) {
        const mentionName =
          el.getAttribute('data-mention') ||
          el.textContent?.replace(/^@/, '') ||
          '';
        return `@${mentionName}`;
      }
      return childrenMd;
    case 'div':
      return `\n${childrenMd}`;
    case 'ul':
      return `\n${childrenMd}\n`;
    case 'ol':
      return `\n${childrenMd}\n`;
    case 'li': {
      const parentTag = el.parentElement?.tagName.toLowerCase();
      const isIndented = el.classList.contains('ml-5');
      const prefix = isIndented ? '  ' : '';
      if (parentTag === 'ol') {
        const index =
          Array.from(el.parentElement?.children || []).indexOf(el) + 1;
        return `${prefix}${index}. ${childrenMd.trim()}\n`;
      }
      return `${prefix}- ${childrenMd.trim()}\n`;
    }
    case 'p':
      return `\n${childrenMd}\n`;
    case 'br':
      return '\n';
    default:
      return childrenMd;
  }
}

/**
 * Normalizes newlines in markdown
 */
function cleanMarkdown(md: string): string {
  return md
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function LinearRichEditor({
  value,
  onChange,
  onBlur,
  taskId,
  placeholder = 'Add description, requirements, bullet points, or context... (Type @ to mention teammates)',
  className,
  onImageClick,
  members = [],
}: LinearRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);

  // Floating bubble toolbar coordinates when text is selected (Linear style)
  const [bubbleMenu, setBubbleMenu] = useState<{
    visible: boolean;
    top: number;
    left: number;
  }>({ visible: false, top: 0, left: 0 });

  const isInternalChangeRef = useRef(false);
  const lastMarkdownRef = useRef(value || '');

  // Initialize contentEditable DOM on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value || '', members);
      lastMarkdownRef.current = value || '';
    }
  }, []);

  // Sync external value updates (e.g. switching issues)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (value !== lastMarkdownRef.current && editorRef.current) {
      lastMarkdownRef.current = value || '';
      editorRef.current.innerHTML = markdownToHtml(value || '', members);
    }
  }, [value, members]);

  // Synchronize HTML DOM to Markdown and trigger parent onChange
  const syncMarkdown = useCallback(() => {
    if (!editorRef.current) return;
    const rawMd = htmlToMarkdown(editorRef.current);
    const cleaned = cleanMarkdown(rawMd);
    lastMarkdownRef.current = cleaned;
    isInternalChangeRef.current = true;
    onChange(cleaned);
  }, [onChange]);

  // Floating selection bubble menu handler (matches Linear Image 3)
  const updateBubbleMenuPosition = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    // Ensure selection is inside editor
    if (!editorRef.current.contains(sel.anchorNode)) {
      setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) {
      setBubbleMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setBubbleMenu({
      visible: true,
      top: rect.top - 46,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateBubbleMenuPosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateBubbleMenuPosition]);

  // Matching team members for @mention
  const matchingMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q),
    );
  }, [members, mentionQuery]);

  // Handle @ mention detection on input
  const checkMentionTrigger = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      setMentionQuery(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = node.textContent?.slice(0, range.startOffset) || '';
      const lastAt = textBefore.lastIndexOf('@');
      if (lastAt !== -1) {
        const query = textBefore.slice(lastAt + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query);
          setMentionIndex(0);
          return;
        }
      }
    }
    setMentionQuery(null);
  };

  const handleInput = () => {
    checkMentionTrigger();
    syncMarkdown();
    updateBubbleMenuPosition();
  };

  // Insert selected mention tag into contentEditable
  const handleSelectMention = (userName: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const textBefore = node.textContent?.slice(0, range.startOffset) || '';
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && node.nodeType === Node.TEXT_NODE) {
      const rangeToDelete = document.createRange();
      rangeToDelete.setStart(node, lastAt);
      rangeToDelete.setEnd(node, range.startOffset);
      rangeToDelete.deleteContents();

      const pill = document.createElement('span');
      pill.className =
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 select-none';
      pill.setAttribute('contenteditable', 'false');
      pill.setAttribute('data-mention', userName);
      pill.textContent = `@${userName}`;

      const space = document.createTextNode('\u00A0');

      rangeToDelete.insertNode(space);
      rangeToDelete.insertNode(pill);

      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    setMentionQuery(null);
    syncMarkdown();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionQuery !== null && matchingMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % matchingMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          (prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length,
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingMembers[mentionIndex];
        if (selected) {
          handleSelectMention(selected.user?.name || 'User');
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
  };

  // Interactive checklist click inside live editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Checkbox toggle
    if (
      target.tagName.toLowerCase() === 'input' &&
      (target as HTMLInputElement).type === 'checkbox'
    ) {
      const checkbox = target as HTMLInputElement;
      const parent = checkbox.closest('.task-checkbox-item');
      if (parent) {
        parent.setAttribute('data-checked', checkbox.checked ? 'true' : 'false');
        const label = parent.querySelector('.task-label');
        if (label) {
          if (checkbox.checked) {
            label.classList.add('line-through', 'text-zinc-500');
            label.classList.remove('text-zinc-200');
          } else {
            label.classList.remove('line-through', 'text-zinc-500');
            label.classList.add('text-zinc-200');
          }
        }
        syncMarkdown();
      }
      return;
    }

    // Delete image action
    const deleteBtn = target.closest('.btn-delete-img');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const card = deleteBtn.closest('.editor-image-card');
      if (card) {
        const attachmentId = card.getAttribute('data-attachment-id');
        if (attachmentId) {
          api.uploads.delete(attachmentId).catch((err) => console.warn('Could not delete upload:', err));
        }
        const nextEl = card.nextElementSibling;
        const parent = card.parentElement;
        card.remove();

        if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
          const range = document.createRange();
          range.setStart(nextEl, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        } else if (parent) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          parent.appendChild(p);
          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        syncMarkdown();
      }
      return;
    }

    // Preview image action
    const previewBtn = target.closest('.btn-preview-img');
    if (previewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const card = previewBtn.closest('.editor-image-card');
      const img = card?.querySelector('img');
      if (img?.src && onImageClick) {
        onImageClick(img.src);
      }
      return;
    }

    // Direct image click also opens preview
    if (target.tagName.toLowerCase() === 'img') {
      const src = (target as HTMLImageElement).src;
      if (src && onImageClick) {
        onImageClick(src);
      }
      return;
    }
  };

  // Upload an image file and insert interactive image card directly into contentEditable
  const uploadAndInsertImage = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await api.uploads.upload(file, taskId);
      const finalUrl = resolveMediaUrl(res.url);

      if (!editorRef.current) return;
      editorRef.current.focus();

      const card = document.createElement('div');
      card.className =
        'editor-image-card group relative inline-block my-3 max-w-full rounded-lg overflow-hidden border border-border/50 bg-[#161722] shadow-md select-none';
      card.setAttribute('contenteditable', 'false');
      card.setAttribute('data-image-url', res.url);
      if (res.id) card.setAttribute('data-attachment-id', res.id);

      const altText = escapeHtml(file.name || 'image');
      card.innerHTML = `
        <img src="${finalUrl}" alt="${altText}" class="max-h-96 rounded-lg object-contain block hover:opacity-95 transition-opacity" />
        <div class="image-actions absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/10 shadow-lg">
          <button type="button" class="btn-preview-img p-1 text-zinc-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer" title="Preview image">
            <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <button type="button" class="btn-delete-img p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/20 transition-colors cursor-pointer" title="Delete image">
            <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;

      const afterP = document.createElement('p');
      afterP.innerHTML = '<br>';

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.collapse(false);
        range.insertNode(afterP);
        range.insertNode(card);

        const newRange = document.createRange();
        newRange.setStart(afterP, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        editorRef.current.appendChild(card);
        editorRef.current.appendChild(afterP);
      }
      syncMarkdown();
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle paste (⌘V): images or rich markdown text
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // 1. Check for image files in clipboard
    const items = e.clipboardData?.items;
    if (items) {
      const imgItem = Array.from(items).find((item) =>
        item.type.startsWith('image/'),
      );
      if (imgItem) {
        e.preventDefault();
        const file = imgItem.getAsFile();
        if (file) {
          uploadAndInsertImage(file);
        }
        return;
      }
    }

    // 2. Check for pasted text
    const plainText = e.clipboardData?.getData('text/plain');
    if (!plainText) return;

    // Detect if pasted text contains markdown structures or multiple formatted blocks
    const isMarkdown =
      /(?:^|\n)(?:#{1,6}\s|[-*+]\s*\[[ xX]\]|[-*+]\s+|\d+\.\s+|>{1,2}\s+|```|---|___|\*\*\*)/m.test(
        plainText,
      ) ||
      /\*\*[^*]+\*\*/.test(plainText) ||
      /\+\+[^+]+\+\+/.test(plainText) ||
      /`[^`]+`/.test(plainText) ||
      /\[[^\]]+\]\([^)]+\)/.test(plainText);

    if (isMarkdown) {
      e.preventDefault();

      // Convert Markdown string to clean WYSIWYG HTML elements
      const html = markdownToHtml(plainText, members);

      if (!editorRef.current) return;

      // If the editor is effectively empty, set HTML directly to avoid stray empty tags
      const currentText = editorRef.current.innerText.trim();
      const sel = window.getSelection();

      if (!currentText || !sel || !sel.rangeCount) {
        editorRef.current.innerHTML = html;
        const newRange = document.createRange();
        newRange.selectNodeContents(editorRef.current);
        newRange.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      } else {
        let range = sel.getRangeAt(0);
        // Ensure range is within this editor
        if (!editorRef.current.contains(range.commonAncestorContainer)) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }

        range.deleteContents();

        const temp = document.createElement('div');
        temp.innerHTML = html;

        const fragment = document.createDocumentFragment();
        let lastNode: Node | null = null;
        while (temp.firstChild) {
          lastNode = fragment.appendChild(temp.firstChild);
        }

        range.insertNode(fragment);

        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }

      syncMarkdown();
    }
  };

  // Handle Drag & Drop of images
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imgFile = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (imgFile) {
      e.preventDefault();
      uploadAndInsertImage(imgFile);
    }
  };

  // Floating Selection Toolbar Actions (Matches Image 3)
  const formatBold = () => {
    document.execCommand('bold', false);
    syncMarkdown();
  };

  const formatItalic = () => {
    document.execCommand('italic', false);
    syncMarkdown();
  };

  const formatStrikethrough = () => {
    document.execCommand('strikeThrough', false);
    syncMarkdown();
  };

  const formatUnderline = () => {
    document.execCommand('underline', false);
    syncMarkdown();
  };

  const formatHeading = () => {
    document.execCommand('formatBlock', false, '<h3>');
    syncMarkdown();
  };

  const formatQuote = () => {
    document.execCommand('formatBlock', false, '<blockquote>');
    syncMarkdown();
  };

  const formatBulletList = () => {
    document.execCommand('insertUnorderedList', false);
    syncMarkdown();
  };

  const formatCode = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || 'code';

    const code = document.createElement('code');
    code.className =
      'px-1.5 py-0.5 rounded bg-[#181926] text-indigo-300 font-mono text-xs border border-border/40';
    code.textContent = selectedText;

    range.deleteContents();
    range.insertNode(code);

    const space = document.createTextNode('\u00A0');
    range.setStartAfter(code);
    range.insertNode(space);

    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    syncMarkdown();
  };

  const formatLink = () => {
    const url = prompt('Enter URL (e.g. https://example.com):');
    if (url) {
      document.execCommand('createLink', false, url);
      syncMarkdown();
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn('relative w-full group/editor', className)}
    >
      {/* Floating Selection Bubble Toolbar (Linear Style - Matches Image 3) */}
      {bubbleMenu.visible && (
        <div
          className="fixed z-50 -translate-x-1/2 flex items-center gap-0.5 bg-[#181924] border border-border/80 shadow-2xl rounded-lg p-1 text-zinc-300 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
          style={{
            top: `${Math.max(10, bubbleMenu.top)}px`,
            left: `${bubbleMenu.left}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatHeading}
            className="px-1.5 py-1 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white font-semibold text-xs cursor-pointer flex items-center gap-0.5"
            title="Heading 3"
          >
            <span>Aa</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatBold}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Bold (⌘B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatItalic}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Italic (⌘I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatStrikethrough}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatUnderline}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Underline (⌘U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-border/60 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatLink}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatQuote}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatCode}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatBulletList}
            className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-300 hover:text-white cursor-pointer"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Mentions Autocomplete Dropdown */}
      {mentionQuery !== null && matchingMembers.length > 0 && (
        <div className="absolute left-0 top-8 z-50 w-64 max-h-56 overflow-y-auto rounded-lg border border-border/70 bg-[#12131d] shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-border/40 mb-1">
            Mention team member
          </div>
          <div className="space-y-0.5">
            {matchingMembers.map((m, idx) => (
              <button
                key={m.id || m.userId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectMention(m.user?.name || 'User');
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer',
                  idx === mentionIndex
                    ? 'bg-indigo-600/30 text-white font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/60',
                )}
              >
                <img
                  src={
                    m.user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      m.user?.name || 'User',
                    )}`
                  }
                  alt={m.user?.name || 'User'}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-border/50 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{m.user?.name || 'Team Member'}</span>
                  {m.user?.email && (
                    <span className="text-[10px] text-zinc-500 truncate">
                      {m.user.email}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seamless Live Rendered Document Body (Matches Image 2 - No Borders, No Fixed Toolbar) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleEditorClick}
        onPaste={handlePaste}
        onBlur={onBlur}
        data-placeholder={placeholder}
        className="outline-none min-h-[120px] py-1 text-sm text-zinc-100 leading-relaxed font-sans cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 empty:before:pointer-events-none focus:outline-none"
      />

      {/* Subtle hover attach image button in corner */}
      <div className="flex items-center justify-between pt-1 opacity-0 group-hover/editor:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800/40 cursor-pointer"
          title="Upload image (or paste directly with ⌘V)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="text-[11px]">Attach image</span>
        </button>
        <span className="text-[10px] text-zinc-600 font-mono">
          Highlight text to format
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadAndInsertImage(file);
            e.target.value = '';
          }
        }}
      />

      {/* Uploading Spinner Badge */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 text-xs text-indigo-400 bg-zinc-900/95 border border-border/60 px-3 py-1.5 rounded-lg shadow-2xl animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}
    </div>
  );
}
