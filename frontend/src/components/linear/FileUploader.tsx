'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Check, Loader2, Download, Paperclip } from 'lucide-react';
import { Attachment } from '../../types';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface FileUploaderProps {
  taskId?: string;
  attachments?: Attachment[];
  onUploadSuccess?: (attachment: Attachment) => void;
  onDeleteSuccess?: (attachmentId: string) => void;
  className?: string;
}

export function FileUploader({
  taskId,
  attachments = [],
  onUploadSuccess,
  onDeleteSuccess,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploads.upload(file, taskId);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        await handleUpload(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      for (const file of files) {
        await handleUpload(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.uploads.delete(id);
      if (onDeleteSuccess) onDeleteSuccess(id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drag & Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group',
          isDragging
            ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(94,106,210,0.2)]'
            : 'border-border/80 hover:border-border hover:bg-secondary/40 bg-secondary/15',
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-foreground">
            {isUploading ? 'Uploading file...' : 'Drop files here or click to browse'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Supports images, PDFs, documents, screenshots up to 25MB
          </p>
        </div>

        {uploadError && (
          <p className="text-xs text-destructive font-medium mt-1">{uploadError}</p>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({attachments.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((att) => {
              const isImg = att.mimeType.startsWith('image/');

              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2.5 p-2 rounded-md border border-border bg-card/60 hover:bg-card transition-colors group relative overflow-hidden"
                >
                  {isImg ? (
                    <div className="w-9 h-9 rounded bg-black/40 overflow-hidden shrink-0 border border-border/50">
                      <img
                        src={att.url}
                        alt={att.originalName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-medium text-foreground truncate" title={att.originalName}>
                      {att.originalName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatFileSize(att.size)}
                    </p>
                  </div>

                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Download or open"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => handleDelete(att.id, e)}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
