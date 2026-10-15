'use client';

import React, { useState, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  File as GenericFileIcon,
  Loader2,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';
import { MessageAttachment } from '../lib/types';
import { uploadChatAttachment } from '../lib/insforge';

interface MessageInputProps {
  onSendMessage: (text: string, attachment?: MessageAttachment) => Promise<void> | void;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const QUICK_EMOJIS = ['👋', '🚀', '🔥', '✨', '👍', '❤️'];

function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  disabled,
  placeholder,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processFile = async (file: File) => {
    if (disabled || isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const { attachment, error } = await uploadChatAttachment(file);
      if (error || !attachment) {
        setUploadError(error || 'Failed to attach file');
      } else {
        setSelectedAttachment(attachment);
        textareaRef.current?.focus();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process file';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      // Reset input values so selecting same file again fires onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleSend = async () => {
    const textToSend = content.trim();
    if ((!textToSend && !selectedAttachment) || disabled || isSending || isUploading) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(textToSend, selectedAttachment || undefined);
      setContent('');
      setSelectedAttachment(null);
      setUploadError(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    // Notify typing with throttle
    if (!typingTimeoutRef.current) {
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processFile(file);
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const removeAttachment = () => {
    setSelectedAttachment(null);
    setUploadError(null);
  };

  const isImageAttachment = selectedAttachment?.type.startsWith('image/');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-3 md:p-4 bg-white/95 dark:bg-[#090d16]/95 border-t border-slate-200/90 dark:border-slate-800/90 backdrop-blur-md transition-colors ${
        isDragging ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 ring-2 ring-indigo-500/30' : ''
      }`}
    >
      {/* Hidden file input elements */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Drag & drop overlay cue */}
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-sm z-30 flex items-center justify-center border-2 border-dashed border-indigo-400 rounded-t-2xl animate-fade-in pointer-events-none">
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-semibold">
            <UploadCloud className="w-5 h-5 text-indigo-400 animate-bounce" />
            <span>Drop file or photo to attach to message</span>
          </div>
        </div>
      )}

      {/* Quick emoji suggestions & helper */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5" />
          </span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              onClick={() => addEmoji(emoji)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              {emoji}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline-block">
          Drop files or paste screenshots anywhere
        </span>
      </div>

      {/* Pending Attachment Preview / Uploading State */}
      {(selectedAttachment || isUploading || uploadError) && (
        <div className="mb-2.5 px-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {isUploading && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl text-xs text-indigo-700 dark:text-indigo-200">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
              <span>Uploading and preparing attachment...</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {selectedAttachment && (
            <div className="inline-flex items-center gap-3 p-2 pr-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-w-full">
              {isImageAttachment ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAttachment.url}
                    alt={selectedAttachment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  {selectedAttachment.name.endsWith('.pdf') ? (
                    <FileText className="w-5 h-5 text-rose-500" />
                  ) : (
                    <GenericFileIcon className="w-5 h-5" />
                  )}
                </div>
              )}

              <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedAttachment.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatFileSize(selectedAttachment.size)} • {selectedAttachment.type || 'file'}
                </p>
              </div>

              <button
                type="button"
                onClick={removeAttachment}
                className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="flex items-end gap-2 bg-slate-100/90 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all">
        {/* Attachment Buttons */}
        <div className="flex items-center gap-0.5 pb-0.5 shrink-0">
          {/* Photos / Images button */}
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Attach image or photo"
            aria-label="Attach photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Any File attachment button */}
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Attach file or document (PDF, TXT, DOC, ZIP...)"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="message-input"
          rows={1}
          disabled={disabled || isSending}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            placeholder ||
            (disabled
              ? 'Select or start a conversation to type a message...'
              : selectedAttachment
              ? 'Add a caption (Press Enter to send)...'
              : 'Type a message (Press Enter to send, Shift+Enter for newline)...')
          }
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none max-h-32 focus:outline-none leading-relaxed py-1 disabled:cursor-not-allowed"
        />

        {/* Send message button */}
        <button
          id="btn-send-message"
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !selectedAttachment) || disabled || isSending || isUploading}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/25 shrink-0 cursor-pointer"
          title="Send message"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
