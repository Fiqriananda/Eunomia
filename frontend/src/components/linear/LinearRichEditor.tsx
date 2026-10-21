'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { MarkdownRenderer, resolveMediaUrl } from '../ui/MarkdownRenderer';
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
  Edit3,
  Check,
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

export function LinearRichEditor({
  value,
  onChange,
  onBlur,
  taskId,
  placeholder = 'Add description, requirements, bullet points, or context... (Supports code ```, checklists [ ], and @mentions)',
  className,
  onImageClick,
  members = [],
}: LinearRichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live View by default; switches to edit mode on click/focus
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [text, setText] = useState(value || '');

  // Mention Tagging State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(-1);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal text with incoming value
  useEffect(() => {
    setText(value || '');
  }, [value]);

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

  // Auto-resize textarea height
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(120, scrollH)}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      adjustHeight();
    }
  }, [text, isEditing, adjustHeight]);

  // Enter edit mode and focus textarea
  const enterEditMode = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustHeight();
      }
    }, 20);
  };

  // Exit edit mode and trigger save
  const exitEditMode = () => {
    setMentionQuery(null);
    setIsEditing(false);
    if (onBlur) onBlur();
  };

  // Handle focus leaving container
  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    exitEditMode();
  };

  // Insert mention tag into text
  const handleSelectMention = (userName: string) => {
    if (mentionCursorPos === -1) return;
    const textarea = textareaRef.current;
    const currentVal = textarea?.value || text;
    const textBeforeAt = currentVal.slice(0, mentionCursorPos);
    const currentCursor =
      textarea?.selectionStart ||
      mentionCursorPos + (mentionQuery?.length || 0) + 1;
    const textAfterCursor = currentVal.slice(currentCursor);

    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setText(inserted);
    onChange(inserted);
    setMentionQuery(null);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = mentionCursorPos + userName.length + 2;
        textarea.setSelectionRange(newPos, newPos);
        adjustHeight();
      }
    }, 10);
  };

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    onChange(newVal);

    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = newVal.slice(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtPos === 0) {
        const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          setMentionQuery(textAfterAt);
          setMentionCursorPos(lastAtPos);
          setMentionIndex(0);
          return;
        }
      }
    }
    setMentionQuery(null);
  };

  // Trigger @ mention from toolbar button
  const handleMentionButtonClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const start = textarea.selectionStart;
    const current = textarea.value;
    const nextVal = current.substring(0, start) + '@' + current.substring(start);
    setText(nextVal);
    onChange(nextVal);
    setMentionQuery('');
    setMentionCursorPos(start);
    setMentionIndex(0);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
      adjustHeight();
    }, 10);
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Mention keyboard navigation
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

    // Escape exits edit mode to Live View
    if (e.key === 'Escape') {
      e.preventDefault();
      exitEditMode();
      return;
    }

    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
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

    // Enter key: continue checklists and lists
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const current = textarea.value;

      const lastNewLine = current.lastIndexOf('\n', start - 1);
      const currentLine = current.substring(lastNewLine + 1, start);

      // Checklist match
      const checkMatch = currentLine.match(
        /^(\s*(?:[-*+]|\d+\.)?\s*\[[ xX]\]\s+)(.*)$/,
      );
      if (checkMatch) {
        e.preventDefault();
        const prefix = checkMatch[1].replace(/\[[xX]\]/, '[ ]');
        const contentAfter = checkMatch[2].trim();

        if (!contentAfter) {
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

      // Bullet / numbered list match
      const listMatch = currentLine.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
      if (listMatch) {
        e.preventDefault();
        const rawPrefix = listMatch[1];
        const contentAfter = listMatch[2].trim();

        if (!contentAfter) {
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

    // Hotkeys: ⌘B / Ctrl+B for Bold, ⌘I / Ctrl+I for Italic, ⌘K for Link
    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        insertSnippet('**', '**', 'bold text');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        insertSnippet('*', '*', 'italic text');
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertSnippet('[', '](https://example.com)', 'link text');
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
      ref={containerRef}
      onBlur={handleContainerBlur}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'relative w-full rounded-lg border transition-colors',
        isEditing
          ? 'border-border/80 bg-[#0d0e15]'
          : 'border-border/30 bg-[#0d0e15]/40 hover:border-border/60',
        className,
      )}
    >
      {/* Edit Mode Toolbar (Only visible when active editing) */}
      {isEditing && (
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/30 bg-[#11121b]/80 text-xs select-none rounded-t-lg animate-in fade-in duration-100">
          {/* Formatting Actions */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('### ', '', 'Heading')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Heading (### )"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('**', '**', 'bold text')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Bold (⌘B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('*', '*', 'italic text')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Italic (⌘I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3 bg-border/40 mx-1" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('\n- ', '', 'List item')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('\n[ ] ', '', 'Task item')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Checklist ([ ])"
            >
              <ListTodo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSnippet('`', '`', 'code')}
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Inline Code (`code`)"
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
              onClick={() =>
                insertSnippet('[', '](https://example.com)', 'link text')
              }
              className="p-1 rounded hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Insert link (⌘K)"
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

          {/* Done / Close Editor Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={exitEditMode}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            title="Finish editing (Esc or click outside)"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* Floating Mentions Autocomplete Dropdown */}
      {isEditing && mentionQuery !== null && matchingMembers.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute left-3 top-9 z-50 w-64 max-h-56 overflow-y-auto rounded-lg border border-border/70 bg-[#12131d] shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100"
        >
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

      {/* Editor Body */}
      <div className="p-3">
        {isEditing ? (
          /* Active Editing: Raw Markdown Textarea with Hotkeys & @ Mentions */
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full min-h-[120px] bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 leading-relaxed font-sans cursor-text font-normal transition-all"
          />
        ) : (
          /* Live View: Seamless Rendered Markdown (Linear / Notion Style) */
          <div
            onClick={(e) => {
              // Don't enter edit mode if user clicked an interactive link, checkbox, or image
              const target = e.target as HTMLElement;
              if (
                target.closest('a') ||
                target.closest('input[type="checkbox"]') ||
                target.closest('img')
              ) {
                return;
              }
              enterEditMode();
            }}
            className="group relative cursor-pointer min-h-[90px] py-0.5 rounded transition-colors"
            title="Click to edit description"
          >
            {/* Subtle hover edit hint */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-border/40 select-none">
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </div>

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
              <div className="text-sm text-zinc-500 italic py-2 flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                <span>{placeholder || 'Add a description... (click to edit)'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Upload Indicator */}
      {isUploading && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-xs text-indigo-400 bg-zinc-900/90 border border-border/40 px-2 py-1 rounded shadow-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}
    </div>
  );
}
