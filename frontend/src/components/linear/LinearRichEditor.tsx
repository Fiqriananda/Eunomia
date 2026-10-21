'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { MarkdownRenderer, resolveMediaUrl } from '../ui/MarkdownRenderer';
import {
  Code,
  ListTodo,
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
  Loader2,
  Columns,
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

export function LinearRichEditor({
  value,
  onChange,
  onBlur,
  taskId,
  placeholder = 'Add description, requirements, bullet points, or context... (Supports code ```, checklists [ ], and tables)',
  className,
  onImageClick,
  members = [],
}: LinearRichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('write');
  const [isUploading, setIsUploading] = useState(false);
  const [text, setText] = useState(value || '');

  // Keep internal text state in sync with external value
  useEffect(() => {
    setText(value || '');
  }, [value]);

  // Auto-resize textarea height
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(160, scrollH)}px`;
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'preview') {
      adjustHeight();
    }
  }, [text, activeTab, adjustHeight]);

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    onChange(newVal);
  };

  // Insert markdown snippet at cursor
  const insertSnippet = (
    before: string,
    after: string = '',
    defaultText: string = '',
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end) || defaultText;

    const replacement = `${before}${selected}${after}`;
    const nextVal =
      current.substring(0, start) + replacement + current.substring(end);

    setText(nextVal);
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      adjustHeight();
    }, 10);
  };

  // Keyboard enhancements: Enter on checklists, Tab indentation, hotkeys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 1. Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: un-indent 2 spaces
        const beforeCursor = textarea.value.substring(0, start);
        if (beforeCursor.endsWith('  ')) {
          const newVal =
            beforeCursor.slice(0, -2) + textarea.value.substring(start);
          setText(newVal);
          onChange(newVal);
          setTimeout(() => {
            textarea.setSelectionRange(start - 2, start - 2);
          }, 0);
        }
      } else {
        // Tab: insert 2 spaces
        const newVal =
          textarea.value.substring(0, start) +
          '  ' +
          textarea.value.substring(end);
        setText(newVal);
        onChange(newVal);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
      return;
    }

    // 2. Enter key: auto-continue lists and checklists
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const current = textarea.value;

      // Find current line
      const lastNewLine = current.lastIndexOf('\n', start - 1);
      const currentLine = current.substring(lastNewLine + 1, start);

      // Checklist match: "- [ ] ", "* [ ] ", "1. [ ] ", "[ ] "
      const checkMatch = currentLine.match(
        /^(\s*(?:[-*+]|\d+\.)?\s*\[[ xX]\]\s+)(.*)$/,
      );
      if (checkMatch) {
        e.preventDefault();
        const prefix = checkMatch[1].replace(/\[[xX]\]/, '[ ]');
        const contentAfter = checkMatch[2].trim();

        if (!contentAfter) {
          // If user pressed enter on empty checkbox, clear the prefix
          const lineStart = lastNewLine + 1;
          const newVal =
            current.substring(0, lineStart) + current.substring(start);
          setText(newVal);
          onChange(newVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Auto-continue checkbox on next line
        const insertion = `\n${prefix}`;
        const newVal =
          current.substring(0, start) + insertion + current.substring(start);
        setText(newVal);
        onChange(newVal);
        setTimeout(() => {
          const nextPos = start + insertion.length;
          textarea.setSelectionRange(nextPos, nextPos);
          adjustHeight();
        }, 0);
        return;
      }

      // Bullet / numbered list match: "- ", "* ", "+ ", "1. "
      const listMatch = currentLine.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
      if (listMatch) {
        e.preventDefault();
        const rawPrefix = listMatch[1];
        const contentAfter = listMatch[2].trim();

        if (!contentAfter) {
          // Clear empty list bullet
          const lineStart = lastNewLine + 1;
          const newVal =
            current.substring(0, lineStart) + current.substring(start);
          setText(newVal);
          onChange(newVal);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        let nextPrefix = rawPrefix;
        const numMatch = rawPrefix.match(/^(\s*)(\d+)\.\s+/);
        if (numMatch) {
          const nextNum = parseInt(numMatch[2], 10) + 1;
          nextPrefix = `${numMatch[1]}${nextNum}. `;
        }

        const insertion = `\n${nextPrefix}`;
        const newVal =
          current.substring(0, start) + insertion + current.substring(start);
        setText(newVal);
        onChange(newVal);
        setTimeout(() => {
          const nextPos = start + insertion.length;
          textarea.setSelectionRange(nextPos, nextPos);
          adjustHeight();
        }, 0);
        return;
      }
    }

    // 3. Hotkeys: ⌘B / Ctrl+B for Bold, ⌘I / Ctrl+I for Italic, ⌘K for Link
    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        insertSnippet('**', '**', 'bold text');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        insertSnippet('*', '*', 'italic text');
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertSnippet('[', '](url)', 'link text');
      }
    }
  };

  // Upload an image file and insert markdown at cursor
  const uploadAndInsertImage = async (file: File) => {
    setIsUploading(true);
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart || text.length;

    const ext = file.type.split('/')[1] || 'png';
    const cleanFileName =
      file.name && file.name !== 'image.png'
        ? file.name
        : `image-${Date.now()}.${ext}`;

    const placeholderText = `\n![Uploading ${cleanFileName}...]()\n`;
    const tempText =
      text.substring(0, start) + placeholderText + text.substring(start);
    setText(tempText);
    onChange(tempText);

    try {
      const res = await api.uploads.upload(file, taskId);
      const finalMarkdown = `\n![${cleanFileName}](${res.url})\n`;
      const finalized = tempText.replace(placeholderText, finalMarkdown);
      setText(finalized);
      onChange(finalized);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      const failedMarkdown = `\n> *Image upload failed: ${err.message || 'Network error'}*\n`;
      const finalized = tempText.replace(placeholderText, failedMarkdown);
      setText(finalized);
      onChange(finalized);
    } finally {
      setIsUploading(false);
      setTimeout(() => adjustHeight(), 50);
    }
  };

  // Handle Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <div
      className={cn(
        'relative w-full rounded-xl border border-border/60 bg-[#0e1019] shadow-sm transition-all focus-within:border-indigo-500/80',
        className,
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Top Toolbar: Format Helpers & Mode Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-[#121422] rounded-t-xl text-xs select-none">
        {/* Markdown Action Buttons */}
        <div className="flex items-center gap-0.5 flex-wrap">
          <button
            type="button"
            onClick={() => insertSnippet('### ', '', 'Heading')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Heading 3 (### )"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**', '**', 'bold text')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('*', '*', 'italic text')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('~~', '~~', 'strikethrough')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-border/60 mx-1" />

          {/* Checklist / Task Button */}
          <button
            type="button"
            onClick={() => insertSnippet('\n[ ] ', '', 'Task item')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Task List ([ ] task)"
          >
            <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-mono">[ ]</span>
          </button>

          {/* Code Block Button */}
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '\n```typescript\n',
                '\n```\n',
                '// Enter code here',
              )
            }
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Code Block (```)"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-mono">```</span>
          </button>

          {/* Table Button */}
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Item 1 | Item 2 | Item 3 |\n',
              )
            }
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {/* Quote Button */}
          <button
            type="button"
            onClick={() => insertSnippet('> ', '', 'quote text')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Quote (> )"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Link Button */}
          <button
            type="button"
            onClick={() => insertSnippet('[', '](https://example.com)', 'link text')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Upload / Embed Image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
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

        {/* View Mode Tabs: Write, Preview, Split */}
        <div className="flex items-center gap-1 bg-[#181a28] p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
              activeTab === 'write'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
              activeTab === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
            title="Split Side-by-Side View"
          >
            <Columns className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="p-3">
        {/* Write Mode */}
        {activeTab === 'write' && (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={onBlur}
            placeholder={placeholder}
            className="w-full min-h-[160px] bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 leading-relaxed font-sans cursor-text font-normal transition-all"
          />
        )}

        {/* Preview Mode: Rendered GitHub Markdown */}
        {activeTab === 'preview' && (
          <div className="min-h-[160px] py-1">
            {text.trim() ? (
              <MarkdownRenderer
                content={text}
                membersList={members}
                onImageClick={onImageClick}
                onContentChange={(newMd) => {
                  setText(newMd);
                  onChange(newMd);
                }}
              />
            ) : (
              <div
                onClick={() => setActiveTab('write')}
                className="text-sm text-zinc-500 italic py-6 text-center cursor-pointer hover:text-zinc-400"
              >
                Nothing to preview. Click here or switch to &quot;Write&quot; to add content.
              </div>
            )}
          </div>
        )}

        {/* Split Side-by-Side Mode */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[180px]">
            <div className="border-r border-border/40 pr-3">
              <span className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5 font-semibold">
                Editor (Markdown)
              </span>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={onBlur}
                placeholder={placeholder}
                className="w-full min-h-[160px] bg-transparent resize-none outline-none text-xs text-zinc-100 placeholder:text-zinc-500 leading-relaxed font-mono cursor-text"
              />
            </div>
            <div className="pl-1 overflow-y-auto max-h-[500px]">
              <span className="block text-[10px] uppercase font-mono text-indigo-400 mb-1.5 font-semibold">
                Live GitHub Preview
              </span>
              {text.trim() ? (
                <MarkdownRenderer
                  content={text}
                  membersList={members}
                  onImageClick={onImageClick}
                  onContentChange={(newMd) => {
                    setText(newMd);
                    onChange(newMd);
                  }}
                />
              ) : (
                <div className="text-xs text-zinc-600 italic py-4">
                  Preview will appear here...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Bottom Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/40 text-[11px] text-zinc-500 bg-[#0c0d16]/60 rounded-b-xl">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">
            Paste images directly (⌘V) or drag & drop files
          </span>
          {isUploading && (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium animate-pulse ml-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading image...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 font-mono">
            {text.length} chars
          </span>
          <span className="text-[10px] text-zinc-600">Auto-saves</span>
        </div>
      </div>
    </div>
  );
}
