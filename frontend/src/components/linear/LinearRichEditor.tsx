'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../ui/MarkdownRenderer';
import {
  Code,
  ListTodo,
  List,
  Bold,
  Italic,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  AtSign,
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
 * Converts Markdown string into styled HTML for contentEditable (Live WYSIWYG)
 */
function markdownToHtml(md: string): string {
  if (!md || !md.trim()) return '';

  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        htmlLines.push(
          `<pre class="code-block bg-[#13141f] text-zinc-200 p-2.5 rounded-lg font-mono text-xs my-2 border border-border/50 overflow-x-auto"><code>${escapeHtml(
            codeBuffer.join('\n'),
          )}</code></pre>`,
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      closeList();
      htmlLines.push(
        `<h3 class="text-base font-semibold text-zinc-100 mt-2 mb-1">${formatInline(
          trimmed.slice(4),
        )}</h3>`,
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeList();
      htmlLines.push(
        `<h2 class="text-lg font-bold text-zinc-100 mt-2.5 mb-1">${formatInline(
          trimmed.slice(3),
        )}</h2>`,
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeList();
      htmlLines.push(
        `<h1 class="text-xl font-bold text-zinc-100 mt-3 mb-1.5">${formatInline(
          trimmed.slice(2),
        )}</h1>`,
      );
      continue;
    }

    // Checklists: - [ ] or - [x]
    const checklistMatch = trimmed.match(/^[-*+]\s*\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      closeList();
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      const label = checklistMatch[2];
      htmlLines.push(
        `<div class="task-checkbox-item flex items-center gap-2 my-1" data-checked="${isChecked}">` +
          `<input type="checkbox" ${
            isChecked ? 'checked' : ''
          } class="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer" />` +
          `<span class="task-label ${
            isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'
          }">${formatInline(label)}</span>` +
          `</div>`,
      );
      continue;
    }

    // Bullet lists
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc list-inside space-y-1 my-1">');
        inList = true;
      }
      htmlLines.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    // Images: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      closeList();
      htmlLines.push(
        `<div class="my-2"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="max-h-72 rounded-lg border border-border/60 object-contain block" /></div>`,
      );
      continue;
    }

    closeList();

    if (!trimmed) {
      htmlLines.push('<p><br></p>');
    } else {
      htmlLines.push(`<p class="my-0.5">${formatInline(trimmed)}</p>`);
    }
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
function formatInline(text: string): string {
  let res = escapeHtml(text);

  // Bold & Italic: ***text***
  res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Strikethrough: ~~text~~
  res = res.replace(
    /~~(.*?)~~/g,
    '<del class="line-through text-zinc-500">$1</del>',
  );
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
  // Mentions: @name
  res = res.replace(/(@[a-zA-Z0-9_\-\.\s]{1,30})/g, (match) => {
    const cleanName = match.trim().replace(/^@/, '');
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 select-none" contenteditable="false" data-mention="${cleanName}">${match}</span>`;
  });

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

  // Child markdown
  const childrenMd = Array.from(el.childNodes).map(htmlToMarkdown).join('');

  switch (tag) {
    case 'h1':
      return `\n# ${childrenMd.trim()}\n\n`;
    case 'h2':
      return `\n## ${childrenMd.trim()}\n\n`;
    case 'h3':
      return `\n### ${childrenMd.trim()}\n\n`;
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
    case 'code':
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        return childrenMd;
      }
      return `\`${childrenMd}\``;
    case 'pre':
      return `\n\`\`\`\n${childrenMd.trim()}\n\`\`\`\n\n`;
    case 'a':
      return `[${childrenMd}](${el.getAttribute('href') || ''})`;
    case 'img': {
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
      if (el.classList.contains('task-checkbox-item')) {
        const input = el.querySelector(
          'input[type="checkbox"]',
        ) as HTMLInputElement | null;
        const isChecked =
          input?.checked || el.getAttribute('data-checked') === 'true';
        const label =
          el.querySelector('.task-label')?.textContent ||
          el.textContent ||
          '';
        return `- [${isChecked ? 'x' : ' '}] ${label.trim()}\n`;
      }
      return `\n${childrenMd}`;
    case 'ul':
      return `\n${childrenMd}\n`;
    case 'ol':
      return `\n${childrenMd}\n`;
    case 'li': {
      const parentTag = el.parentElement?.tagName.toLowerCase();
      if (parentTag === 'ol') {
        const index =
          Array.from(el.parentElement?.children || []).indexOf(el) + 1;
        return `${index}. ${childrenMd.trim()}\n`;
      }
      return `- ${childrenMd.trim()}\n`;
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

  // Prevents cursor jumping: tracks internal updates vs external prop updates
  const isInternalChangeRef = useRef(false);
  const lastMarkdownRef = useRef(value || '');

  // Initialize contentEditable DOM on initial mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value || '');
      lastMarkdownRef.current = value || '';
    }
  }, []);

  // Sync external value updates (e.g., when switching issues)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (value !== lastMarkdownRef.current && editorRef.current) {
      lastMarkdownRef.current = value || '';
      editorRef.current.innerHTML = markdownToHtml(value || '');
    }
  }, [value]);

  // Synchronize HTML DOM to Markdown and trigger parent onChange
  const syncMarkdown = useCallback(() => {
    if (!editorRef.current) return;
    const rawMd = htmlToMarkdown(editorRef.current);
    const cleaned = cleanMarkdown(rawMd);
    lastMarkdownRef.current = cleaned;
    isInternalChangeRef.current = true;
    onChange(cleaned);
  }, [onChange]);

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
    // Mention autocomplete navigation
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

    // Image click lightbox
    if (target.tagName.toLowerCase() === 'img') {
      const src = (target as HTMLImageElement).src;
      if (src && onImageClick) {
        onImageClick(src);
      }
    }
  };

  // Upload an image file and insert <img> element directly into contentEditable
  const uploadAndInsertImage = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await api.uploads.upload(file, taskId);
      const finalUrl = resolveMediaUrl(res.url);

      if (!editorRef.current) return;
      editorRef.current.focus();

      const img = document.createElement('img');
      img.src = finalUrl;
      img.alt = file.name || 'image';
      img.className =
        'max-h-72 rounded-lg border border-border/60 my-2 object-contain block';

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(img);
      } else {
        editorRef.current.appendChild(img);
      }
      syncMarkdown();
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image paste
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imgItem = Array.from(items).find((item) =>
      item.type.startsWith('image/'),
    );
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) {
        uploadAndInsertImage(file);
      }
    }
  };

  // Toolbar Formatting Actions (Never steals focus via e.preventDefault on onMouseDown)
  const formatHeading = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('formatBlock', false, '<h3>');
    syncMarkdown();
  };

  const formatBold = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('bold', false);
    syncMarkdown();
  };

  const formatItalic = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('italic', false);
    syncMarkdown();
  };

  const formatBulletList = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertUnorderedList', false);
    syncMarkdown();
  };

  const insertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    const div = document.createElement('div');
    div.className = 'task-checkbox-item flex items-center gap-2 my-1';
    div.setAttribute('data-checked', 'false');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer';

    const span = document.createElement('span');
    span.className = 'task-label text-zinc-200';
    span.innerHTML = '&nbsp;';

    div.appendChild(checkbox);
    div.appendChild(span);

    range.deleteContents();
    range.insertNode(div);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);

    syncMarkdown();
  };

  const formatCode = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
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

  const handleMentionButtonClick = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, '@');
    setMentionQuery('');
    setMentionIndex(0);
  };

  const formatLink = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const url = prompt('Enter link URL (e.g. https://example.com):');
    if (url) {
      document.execCommand('createLink', false, url);
      syncMarkdown();
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border border-border/40 bg-[#0d0e15] focus-within:border-border/80 transition-colors',
        className,
      )}
    >
      {/* Sleek WYSIWYG Toolbar (No Write/Preview toggle, clean live actions) */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/30 bg-[#11121b]/80 text-xs select-none rounded-t-lg">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatHeading}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Heading (H3)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatBold}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Bold (⌘B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatItalic}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Italic (⌘I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-border/40 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatBulletList}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertChecklist}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Task checklist"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatCode}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Inline code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-border/40 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMentionButtonClick}
            className="p-1 rounded hover:bg-zinc-800/70 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title="Mention team member (@)"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={formatLink}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Insert link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Attach image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

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
        </div>
      </div>

      {/* Floating Mentions Autocomplete Dropdown */}
      {mentionQuery !== null && matchingMembers.length > 0 && (
        <div className="absolute left-3 top-9 z-50 w-64 max-h-56 overflow-y-auto rounded-lg border border-border/70 bg-[#12131d] shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100">
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

      {/* Live WYSIWYG Rendered Document Body */}
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
        className="outline-none min-h-[140px] p-3.5 text-sm text-zinc-100 leading-relaxed font-sans cursor-text space-y-1 empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 empty:before:pointer-events-none focus:outline-none"
      />

      {/* Uploading Spinner Badge */}
      {isUploading && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-xs text-indigo-400 bg-zinc-900/90 border border-border/40 px-2 py-1 rounded shadow-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}
    </div>
  );
}
