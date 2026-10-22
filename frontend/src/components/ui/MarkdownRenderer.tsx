'use client';

import React, { useState, useMemo } from 'react';
import { WorkspaceMember } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Check,
  Copy,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { ProfileHoverCard } from './ProfileHoverCard';

interface MarkdownRendererProps {
  content: string;
  membersList?: WorkspaceMember[];
  className?: string;
  onImageClick?: (url: string) => void;
  onContentChange?: (newContent: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}/${url}`;
}

/**
 * Syntax colorizer helper for code blocks
 */
function highlightCode(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');

  return lines.map((line, lineIdx) => {
    // Regex tokens: keywords, strings, comments, numbers, booleans
    const tokenRegex =
      /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|import|export|from|class|extends|interface|type|public|private|protected|async|await|if|else|switch|case|break|for|while|try|catch|finally|throw|new|typeof|instanceof|void|default|as)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(
          <span key={`txt-${lineIdx}-${lastIdx}`} className="text-zinc-200">
            {line.substring(lastIdx, match.index)}
          </span>,
        );
      }

      const token = match[0];
      let colorClass = 'text-zinc-200';

      if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
        colorClass = 'text-zinc-500 italic';
      } else if (
        token.startsWith('"') ||
        token.startsWith("'") ||
        token.startsWith('`')
      ) {
        colorClass = 'text-emerald-400';
      } else if (
        /^(const|let|var|function|return|import|export|from|class|extends|interface|type|public|private|protected|async|await|if|else|switch|case|break|for|while|try|catch|finally|throw|new|typeof|instanceof|void|default|as)$/.test(
          token,
        )
      ) {
        colorClass = 'text-indigo-400 font-medium';
      } else if (/^(true|false|null|undefined)$/.test(token)) {
        colorClass = 'text-rose-400 font-medium';
      } else if (/^\d+(?:\.\d+)?$/.test(token)) {
        colorClass = 'text-amber-300';
      }

      parts.push(
        <span key={`tok-${lineIdx}-${match.index}`} className={colorClass}>
          {token}
        </span>,
      );

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(
        <span key={`tail-${lineIdx}-${lastIdx}`} className="text-zinc-200">
          {line.substring(lastIdx)}
        </span>,
      );
    }

    return (
      <div key={`line-${lineIdx}`} className="table-row">
        <span className="table-cell pr-4 text-right select-none text-zinc-600 font-mono text-[11px] w-8">
          {lineIdx + 1}
        </span>
        <span className="table-cell font-mono text-xs whitespace-pre">
          {parts.length > 0 ? parts : ' '}
        </span>
      </div>
    );
  });
}

/**
 * Code Block with Language Badge & Copy Button
 */
function CodeBlockComponent({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayLang = (lang || 'code').toUpperCase();

  return (
    <div className="my-3 rounded-xl border border-border/70 bg-[#090a10] overflow-hidden shadow-lg group/code">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#10121d] border-b border-border/50 text-xs">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-indigo-400">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover/code:text-zinc-200" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Line Numbers */}
      <div className="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono">
        <div className="table w-full">{highlightCode(code, lang)}</div>
      </div>
    </div>
  );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  membersList = [],
  className,
  onImageClick,
  onContentChange,
}) => {
  if (!content) return null;

  const { workspace } = useAuth();

  const effectiveMembers = useMemo(() => {
    if (membersList && membersList.length > 0) return membersList;
    return workspace?.members || [];
  }, [membersList, workspace?.members]);

  const memberNames = useMemo(() => {
    const names = new Set<string>();
    effectiveMembers.forEach((m) => {
      if (m.user?.name) names.add(m.user.name.trim());
      if (m.user?.email) names.add(m.user.email.split('@')[0].trim());
    });
    return Array.from(names);
  }, [effectiveMembers]);

  // Master regex for inline markdown, dynamically matching full workspace member names
  const masterRegex = useMemo(() => {
    const escapedMembers = [...memberNames]
      .filter((n) => n && n.trim().length > 0)
      .sort((a, b) => b.length - a.length)
      .map((n) => n.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const mentionPattern =
      escapedMembers.length > 0
        ? `(@(?:${escapedMembers.join('|')}|[a-zA-Z0-9_\\-\\.]+)(?=$|[\\s.,!?:;]))`
        : `(@[a-zA-Z0-9_\\-\\.]+(?=$|[\\s.,!?:;]))`;

    return new RegExp(
      `(!\\[(.*?)\\]\\((.*?)\\)|\\[(.*?)\\]\\((.*?)\\)|~~([^~]+)~~|\\*\\*\\*([^*]+)\\*\\*\\*|\\*\\*([^*]+)\\*\\*|\\*([^*]+)\\*|\`([^\`]+)\`|${mentionPattern}|(https?:\\/\\/[^\\s]+))`,
      'gi',
    );
  }, [memberNames]);

  // Helper to toggle checkbox on a specific line
  const handleToggleCheckbox = (lineIndex: number, currentChecked: boolean) => {
    if (!onContentChange) return;
    const rawLines = content.split('\n');
    if (lineIndex < 0 || lineIndex >= rawLines.length) return;

    const targetLine = rawLines[lineIndex];
    let newTargetLine = targetLine;

    if (currentChecked) {
      // Toggle to unchecked
      newTargetLine = targetLine.replace(
        /^(\s*(?:[-*+]|\d+\.)?\s*)\[[xX]\]/,
        '$1[ ]',
      );
    } else {
      // Toggle to checked
      newTargetLine = targetLine.replace(
        /^(\s*(?:[-*+]|\d+\.)?\s*)\[\s*\]/,
        '$1[x]',
      );
    }

    rawLines[lineIndex] = newTargetLine;
    onContentChange(rawLines.join('\n'));
  };

  // Helper to parse inline markdown (images, links, bold, italic, strikethrough, code, mentions)
  const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
    const regex = new RegExp(masterRegex.source, masterRegex.flags);
    regex.lastIndex = 0;

    const nodes: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
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
                onClick={() =>
                  onImageClick
                    ? onImageClick(finalUrl)
                    : window.open(finalUrl, '_blank')
                }
                className="group relative inline-block cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-[#0e0f18] shadow-md hover:border-primary/60 transition-all max-w-full"
              >
                <img
                  src={finalUrl}
                  alt={altText}
                  loading="lazy"
                  className="max-h-[480px] max-w-full w-auto object-contain rounded-xl transition-all duration-200 group-hover:brightness-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display =
                        'flex';
                    }
                  }}
                />
                <span
                  style={{ display: 'none' }}
                  className="p-3 items-center gap-2 text-xs text-zinc-400"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                  <span>{altText} (Image failed to load)</span>
                </span>
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
            className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>,
        );
      }
      // 3. Strikethrough: ~~text~~
      else if (fullMatch.startsWith('~~')) {
        const strikeText = match[6];
        nodes.push(
          <del
            key={`${keyPrefix}-del-${match.index}`}
            className="line-through text-zinc-500"
          >
            {strikeText}
          </del>,
        );
      }
      // 4. Bold + Italic: ***text***
      else if (fullMatch.startsWith('***')) {
        const biText = match[7];
        nodes.push(
          <strong
            key={`${keyPrefix}-bi-${match.index}`}
            className="font-bold italic text-white"
          >
            {biText}
          </strong>,
        );
      }
      // 5. Bold: **text**
      else if (fullMatch.startsWith('**')) {
        const boldText = match[8];
        nodes.push(
          <strong
            key={`${keyPrefix}-bold-${match.index}`}
            className="font-semibold text-white"
          >
            {boldText}
          </strong>,
        );
      }
      // 6. Italic: *text*
      else if (fullMatch.startsWith('*')) {
        const italicText = match[9];
        nodes.push(
          <em
            key={`${keyPrefix}-italic-${match.index}`}
            className="italic text-zinc-300"
          >
            {italicText}
          </em>,
        );
      }
      // 7. Inline Code: `code`
      else if (fullMatch.startsWith('`')) {
        const codeText = match[10];
        nodes.push(
          <code
            key={`${keyPrefix}-code-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-[#161824] border border-border/60 text-indigo-300 text-[11px] font-mono"
          >
            {codeText}
          </code>,
        );
      }
      // 8. Mention: @username
      else if (fullMatch.startsWith('@')) {
        const mentionName = fullMatch.slice(1).trim();
        const matchedMember = effectiveMembers.find((m) => {
          const mName = m.user?.name?.toLowerCase() || '';
          const mEmail = m.user?.email?.split('@')[0]?.toLowerCase() || '';
          const q = mentionName.toLowerCase();
          return mName === q || mEmail === q || mName.startsWith(q) || q.startsWith(mName);
        });
        const isKnownMember =
          !!matchedMember ||
          memberNames.some(
            (n) =>
              n.toLowerCase() === mentionName.toLowerCase() ||
              n.toLowerCase().split(' ')[0] === mentionName.toLowerCase(),
          );

        const mentionBadge = (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors mx-0.5 align-baseline cursor-pointer',
              isKnownMember
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold hover:bg-indigo-500/30'
                : 'bg-zinc-800/60 text-zinc-400 border border-border/40 hover:bg-zinc-800',
            )}
          >
            @{mentionName}
          </span>
        );

        nodes.push(
          <ProfileHoverCard
            key={`${keyPrefix}-mention-${match.index}`}
            user={matchedMember?.user || { name: mentionName }}
            member={matchedMember}
            workspaceName={workspace?.name}
          >
            {mentionBadge}
          </ProfileHoverCard>,
        );
      }
      // 9. Autolink: https://...
      else if (fullMatch.startsWith('http')) {
        nodes.push(
          <a
            key={`${keyPrefix}-autolink-${match.index}`}
            href={fullMatch}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-0.5 break-all"
          >
            <span>{fullMatch}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
          </a>,
        );
      }

      lastIdx = regex.lastIndex;
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

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block: ``` or ````
    const codeBlockMatch = line.trim().match(/^(`{3,4})(.*)$/);
    if (codeBlockMatch) {
      const fence = codeBlockMatch[1];
      const lang = codeBlockMatch[2].trim();
      const codeLines: string[] = [];
      i++;

      while (i < lines.length) {
        if (lines[i].trim().startsWith(fence)) {
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }

      elements.push(
        <CodeBlockComponent
          key={`codeblock-${i}`}
          code={codeLines.join('\n')}
          lang={lang}
        />,
      );
      i++;
      continue;
    }

    // 2. Table Block: lines with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith('|') &&
        lines[i].trim().endsWith('|')
      ) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const alignCells = tableLines[1]
          .split('|')
          .slice(1, -1)
          .map((c) => {
            const trim = c.trim();
            if (trim.startsWith(':') && trim.endsWith(':')) return 'center';
            if (trim.endsWith(':')) return 'right';
            return 'left';
          });

        const bodyRows = tableLines.slice(2).map((row) =>
          row
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim()),
        );

        elements.push(
          <div
            key={`table-${i}`}
            className="my-3 overflow-x-auto rounded-xl border border-border/70 bg-[#0c0d16] shadow-md"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#121422] border-b border-border/70">
                  {headerCells.map((header, hIdx) => (
                    <th
                      key={`th-${hIdx}`}
                      style={{ textAlign: alignCells[hIdx] || 'left' }}
                      className="px-3.5 py-2.5 font-semibold text-zinc-100 uppercase tracking-wider text-[11px]"
                    >
                      {renderInline(header, `th-${hIdx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={`tr-${rIdx}`}
                    className="hover:bg-indigo-500/5 transition-colors even:bg-[#0f101b]"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${rIdx}-${cIdx}`}
                        style={{ textAlign: alignCells[cIdx] || 'left' }}
                        className="px-3.5 py-2 text-zinc-300"
                      >
                        {renderInline(cell, `td-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    // 3. GitHub Callout Alert: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (alertMatch) {
      const alertType = alertMatch[1].toUpperCase();
      const alertLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].startsWith('>')) {
        alertLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }

      let alertStyles = {
        border: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
        badge: 'text-blue-400',
        icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
      };

      if (alertType === 'TIP') {
        alertStyles = {
          border: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
          badge: 'text-emerald-400',
          icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
      } else if (alertType === 'IMPORTANT') {
        alertStyles = {
          border: 'border-purple-500/40 bg-purple-500/10 text-purple-200',
          badge: 'text-purple-400',
          icon: <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />,
        };
      } else if (alertType === 'WARNING') {
        alertStyles = {
          border: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
          badge: 'text-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
        };
      } else if (alertType === 'CAUTION') {
        alertStyles = {
          border: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
          badge: 'text-rose-400',
          icon: <Flame className="w-4 h-4 text-rose-400 shrink-0" />,
        };
      }

      elements.push(
        <div
          key={`alert-${i}`}
          className={cn(
            'my-3 p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed shadow-sm',
            alertStyles.border,
          )}
        >
          {alertStyles.icon}
          <div className="space-y-1">
            <span
              className={cn(
                'font-bold uppercase tracking-wider text-[11px] block',
                alertStyles.badge,
              )}
            >
              {alertType}
            </span>
            <div className="text-zinc-200">
              {alertLines.map((al, alIdx) => (
                <p key={`al-${alIdx}`}>{renderInline(al, `al-${i}-${alIdx}`)}</p>
              ))}
            </div>
          </div>
        </div>,
      );
      continue;
    }

    // 4. Checklist / Task Item:
    // Matches:
    // "- [ ] task"
    // "* [ ] task"
    // "1. [ ] task"
    // "[ ] task"  (Directly accepted without bullet!)
    const checklistRegex =
      /^(\s*(?:[-*+]|\d+\.)?\s*)\[([ xX])\]\s*(.*)$/;
    const checkMatch = line.match(checklistRegex);

    if (checkMatch) {
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const taskText = checkMatch[3];
      const currentLineIdx = i;

      elements.push(
        <div
          key={`checklist-${i}`}
          className="flex items-start gap-2.5 my-1.5 text-xs group/item"
        >
          <button
            type="button"
            onClick={() => handleToggleCheckbox(currentLineIdx, isChecked)}
            disabled={!onContentChange}
            className={cn(
              'mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
              onContentChange ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default',
              isChecked
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'border-zinc-600 bg-zinc-900/80 hover:bg-zinc-800',
            )}
            title={onContentChange ? 'Click to toggle task' : undefined}
          >
            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
          <span
            className={cn(
              'leading-relaxed transition-colors',
              isChecked
                ? 'line-through text-zinc-500 select-none'
                : 'text-zinc-200',
            )}
          >
            {renderInline(taskText, `check-${i}`)}
          </span>
        </div>,
      );
      i++;
      continue;
    }

    // 5. Headers: # to ######
    if (line.startsWith('###### ')) {
      elements.push(
        <h6
          key={`h6-${i}`}
          className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-3 mb-1"
        >
          {renderInline(line.slice(7), `h6-${i}`)}
        </h6>,
      );
    } else if (line.startsWith('##### ')) {
      elements.push(
        <h5
          key={`h5-${i}`}
          className="text-xs font-semibold text-zinc-200 mt-3 mb-1"
        >
          {renderInline(line.slice(6), `h5-${i}`)}
        </h5>,
      );
    } else if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-sm font-semibold text-white mt-3.5 mb-1.5"
        >
          {renderInline(line.slice(5), `h4-${i}`)}
        </h4>,
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold text-white mt-4 mb-1.5"
        >
          {renderInline(line.slice(4), `h3-${i}`)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-bold text-white mt-5 mb-2"
        >
          {renderInline(line.slice(3), `h2-${i}`)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl font-extrabold text-white mt-5 mb-2.5 border-b border-border/50 pb-1.5"
        >
          {renderInline(line.slice(2), `h1-${i}`)}
        </h1>,
      );
    }
    // 6. Horizontal Rule: ---, ***, ___
    else if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-border/50" />);
    }
    // 7. Standard Blockquote: > text
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-indigo-500/70 pl-3.5 my-2.5 text-zinc-400 italic text-xs leading-relaxed"
        >
          {renderInline(line.slice(2), `quote-${i}`)}
        </blockquote>,
      );
    }
    // 8. Bullet list: - or * or +
    else if (/^[-*+]\s+(.*)/.test(line)) {
      const itemText = line.replace(/^[-*+]\s+/, '');
      elements.push(
        <li
          key={`li-${i}`}
          className="ml-5 list-disc text-zinc-300 my-0.5 text-xs leading-relaxed"
        >
          {renderInline(itemText, `li-${i}`)}
        </li>,
      );
    }
    // 9. Numbered list: 1. 2. etc.
    else if (/^\d+\.\s+(.*)/.test(line)) {
      const itemText = line.replace(/^\d+\.\s+/, '');
      elements.push(
        <li
          key={`oli-${i}`}
          className="ml-5 list-decimal text-zinc-300 my-0.5 text-xs leading-relaxed"
        >
          {renderInline(itemText, `oli-${i}`)}
        </li>,
      );
    }
    // 10. Empty line / Paragraph
    else {
      if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p
            key={`p-${i}`}
            className="my-1 text-zinc-300 text-xs leading-relaxed"
          >
            {renderInline(line, `p-${i}`)}
          </p>,
        );
      }
    }

    i++;
  }

  return (
    <div className={cn('markdown-body space-y-0.5', className)}>{elements}</div>
  );
};
