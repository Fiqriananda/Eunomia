import React from 'react';
import { WorkspaceMember } from '../../types';
import { cn } from '../../lib/utils';
import { ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  membersList?: WorkspaceMember[];
  className?: string;
  onImageClick?: (url: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}/${url}`;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  membersList = [],
  className,
  onImageClick,
}) => {
  if (!content) return null;

  const memberNames = membersList
    .map((m) => m.user?.name)
    .filter(Boolean) as string[];

  // Tokenize by lines and markdown blocks
  const lines = content.split('\n');

  // Helper to parse inline markdown (images, links, bold, code, mentions)
  const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
    // Regex for markdown images: ![alt](url)
    // Regex for links: [text](url)
    // Regex for code: `code`
    // Regex for bold: **text**
    // Regex for italic: *text*
    // Regex for mentions: @username
    const masterRegex = /(!\[(.*?)\]\((.*?)\)|\[(.*?)\]\((.*?)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|(@[a-zA-Z0-9_\-\.\s]+?(?=\s|$|[.,!?])))/g;

    const nodes: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = masterRegex.exec(text)) !== null) {
      // Add preceding plain text
      if (match.index > lastIdx) {
        nodes.push(
          <span key={`${keyPrefix}-txt-${lastIdx}`}>
            {text.substring(lastIdx, match.index)}
          </span>,
        );
      }

      const [fullMatch] = match;

      // 1. Markdown Image: ![alt](url)
      if (fullMatch.startsWith('![')) {
        const altText = match[2] || 'Image';
        const rawUrl = match[3] || '';

        if (!rawUrl || altText.toLowerCase().includes('uploading')) {
          // GitHub style uploading placeholder
          nodes.push(
            <div
              key={`${keyPrefix}-img-upload-${match.index}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 my-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs animate-pulse select-none"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{altText || 'Uploading image...'}</span>
            </div>,
          );
        } else {
          const finalUrl = resolveMediaUrl(rawUrl);
          nodes.push(
            <span
              key={`${keyPrefix}-img-${match.index}`}
              className="block my-2 max-w-full"
            >
              <span
                onClick={() => onImageClick ? onImageClick(finalUrl) : window.open(finalUrl, '_blank')}
                className="group relative inline-block cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-[#0e0f18] shadow-md hover:border-primary/60 transition-all max-w-full"
              >
                <img
                  src={finalUrl}
                  alt={altText}
                  loading="lazy"
                  className="max-h-[480px] max-w-full w-auto object-contain rounded-xl transition-all duration-200 group-hover:brightness-105"
                  onError={(e) => {
                    // Fallback on broken image
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                {/* Fallback container if load fails */}
                <span
                  style={{ display: 'none' }}
                  className="p-3 items-center gap-2 text-xs text-zinc-400"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                  <span>{altText} (Image failed to load)</span>
                </span>
                {/* Hover overlay hint */}
                <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-[11px] text-zinc-200 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg pointer-events-none">
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                  <span>View full size</span>
                </span>
              </span>
            </span>,
          );
        }
      }
      // 2. Link: [text](url)
      else if (fullMatch.startsWith('[')) {
        const linkText = match[4];
        const linkHref = match[5];
        nodes.push(
          <a
            key={`${keyPrefix}-link-${match.index}`}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>,
        );
      }
      // 3. Inline Code: `code`
      else if (fullMatch.startsWith('`')) {
        const codeText = match[6];
        nodes.push(
          <code
            key={`${keyPrefix}-code-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-[#161824] border border-border/50 text-indigo-300 text-[11px] font-mono"
          >
            {codeText}
          </code>,
        );
      }
      // 4. Bold: **text**
      else if (fullMatch.startsWith('**')) {
        const boldText = match[7];
        nodes.push(
          <strong
            key={`${keyPrefix}-bold-${match.index}`}
            className="font-semibold text-white"
          >
            {boldText}
          </strong>,
        );
      }
      // 5. Italic: *text*
      else if (fullMatch.startsWith('*')) {
        const italicText = match[8];
        nodes.push(
          <em
            key={`${keyPrefix}-italic-${match.index}`}
            className="italic text-zinc-300"
          >
            {italicText}
          </em>,
        );
      }
      // 6. Mention: @username
      else if (fullMatch.startsWith('@')) {
        const mentionName = fullMatch.slice(1).trim();
        const isKnownMember = memberNames.some(
          (n) => n.toLowerCase() === mentionName.toLowerCase(),
        );
        nodes.push(
          <span
            key={`${keyPrefix}-mention-${match.index}`}
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors mx-0.5 align-baseline',
              isKnownMember
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                : 'bg-zinc-800/60 text-zinc-400 border border-border/40',
            )}
          >
            @{mentionName}
          </span>,
        );
      }

      lastIdx = masterRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      nodes.push(
        <span key={`${keyPrefix}-txt-${lastIdx}`}>
          {text.substring(lastIdx)}
        </span>,
      );
    }

    return nodes;
  };

  // Render multi-line blocks
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={`codeblock-${i}`}
            className="my-3 p-3 rounded-lg bg-[#0b0c13] border border-border/70 overflow-x-auto text-xs font-mono text-zinc-200"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>,
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-white mt-3 mb-1">
          {renderInline(line.slice(4), `h3-${i}`)}
        </h4>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-white mt-4 mb-1.5">
          {renderInline(line.slice(3), `h2-${i}`)}
        </h3>,
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold text-white mt-4 mb-2">
          {renderInline(line.slice(2), `h1-${i}`)}
        </h2>,
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-indigo-500/60 pl-3 my-2 text-zinc-400 italic text-xs"
        >
          {renderInline(line.slice(2), `quote-${i}`)}
        </blockquote>,
      );
    }
    // Task list / Checkbox
    else if (/^[-*]\s+\[([ xX])\]\s+(.*)/.test(line)) {
      const match = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
      if (match) {
        const isChecked = match[1].toLowerCase() === 'x';
        elements.push(
          <div key={`task-${i}`} className="flex items-center gap-2 my-1 text-xs">
            <input
              type="checkbox"
              readOnly
              checked={isChecked}
              className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 pointer-events-none w-3.5 h-3.5"
            />
            <span className={cn(isChecked ? 'line-through text-zinc-500' : 'text-zinc-300')}>
              {renderInline(match[2], `task-txt-${i}`)}
            </span>
          </div>,
        );
      }
    }
    // Bullet list
    else if (/^[-*]\s+(.*)/.test(line)) {
      const itemText = line.replace(/^[-*]\s+/, '');
      elements.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-zinc-300 my-0.5 text-xs">
          {renderInline(itemText, `li-${i}`)}
        </li>,
      );
    }
    // Numbered list
    else if (/^\d+\.\s+(.*)/.test(line)) {
      const itemText = line.replace(/^\d+\.\s+/, '');
      elements.push(
        <li key={`oli-${i}`} className="ml-4 list-decimal text-zinc-300 my-0.5 text-xs">
          {renderInline(itemText, `oli-${i}`)}
        </li>,
      );
    }
    // Regular line / Paragraph
    else {
      if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="my-1 text-zinc-300 text-xs leading-relaxed">
            {renderInline(line, `p-${i}`)}
          </p>,
        );
      }
    }
  }

  // Handle remaining unclosed codeblock
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="codeblock-unclosed"
        className="my-3 p-3 rounded-lg bg-[#0b0c13] border border-border/70 overflow-x-auto text-xs font-mono text-zinc-200"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>,
    );
  }

  return <div className={cn('markdown-body space-y-0.5', className)}>{elements}</div>;
};
