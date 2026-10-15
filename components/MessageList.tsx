'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message, Profile, MessageAttachment } from '../lib/types';
import {
  CheckCheck,
  ArrowDown,
  MessageSquareDashed,
  Download,
  ZoomIn,
  FileText,
  File as GenericFileIcon,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentProfile: Profile;
  otherProfile?: Profile;
  typingUserName: string | null;
}

function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileBadge(name: string, type: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || type.includes('pdf')) {
    return { label: 'PDF', bg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { label: 'ZIP', bg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' };
  }
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return { label: 'DOC', bg: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' };
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return { label: 'AUDIO', bg: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30' };
  }
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'html', 'css'].includes(ext)) {
    return { label: 'CODE', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' };
  }
  return { label: ext.toUpperCase() || 'FILE', bg: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30' };
}

export default function MessageList({
  messages,
  currentProfile,
  otherProfile,
  typingUserName,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<MessageAttachment | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, typingUserName, scrollToBottom]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleDownloadAttachment = (e: React.MouseEvent, attachment: MessageAttachment) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative flex-1 min-h-0 bg-slate-50/50 dark:bg-[#070b12] transition-colors">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-md flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
              <MessageSquareDashed className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {otherProfile ? `Conversation with ${otherProfile.display_name}` : 'No conversation selected'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              {otherProfile
                ? 'Send a message, photo, or document below to start this live encrypted conversation.'
                : 'Choose a contact from the sidebar or click Chat to begin real-time messaging.'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.sender_id === currentProfile.id;
            const senderName =
              isSelf
                ? currentProfile.display_name
                : msg.sender?.display_name || otherProfile?.display_name || 'User';

            const prevMsg = messages[index - 1];
            const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id;
            const hasAttachment = Boolean(msg.attachment);
            const isImage = msg.attachment?.type.startsWith('image/');

            return (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className={`flex gap-3 ${isSelf ? 'justify-end' : 'justify-start'} ${
                  isSameSenderAsPrev ? 'mt-1' : 'mt-4'
                }`}
              >
                {/* Other user's avatar */}
                {!isSelf && (
                  <div className="w-8 shrink-0">
                    {!isSameSenderAsPrev ? (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shadow-xs">
                        {getInitials(senderName)}
                      </div>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                {/* Message Bubble container */}
                <div
                  className={`max-w-[85%] sm:max-w-md md:max-w-lg ${
                    isSelf ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender name for others */}
                  {!isSelf && !isSameSenderAsPrev && (
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 pl-1">
                      {senderName}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl shadow-xs transition-all overflow-hidden ${
                      isSelf
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs shadow-md shadow-indigo-600/10'
                        : 'bg-white dark:bg-slate-850 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/70 text-slate-850 dark:text-slate-100 rounded-bl-xs'
                    } ${hasAttachment && !msg.content ? 'p-1.5 sm:p-2' : 'px-4 py-2.5'}`}
                  >
                    {/* Attachment: Image Preview */}
                    {hasAttachment && isImage && msg.attachment && (
                      <div
                        onClick={() => setLightboxImage(msg.attachment!)}
                        className="relative group rounded-xl overflow-hidden cursor-pointer max-w-sm max-h-80 bg-slate-900 border border-slate-200 dark:border-slate-800 mb-1"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name}
                          className="w-full h-auto max-h-80 object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
                          loading="lazy"
                        />

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-transform hover:scale-110">
                            <ZoomIn className="w-4 h-4" />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                            title="Download image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attachment: Document / Generic File */}
                    {hasAttachment && !isImage && msg.attachment && (
                      <div
                        onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelf
                            ? 'bg-black/20 hover:bg-black/30 border border-white/10'
                            : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-700/80'
                        } ${msg.content ? 'mb-2' : 'mb-0.5'}`}
                      >
                        {/* File Badge Icon */}
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                          {msg.attachment.name.endsWith('.pdf') ? (
                            <FileText className="w-5 h-5 text-rose-500" />
                          ) : (
                            <GenericFileIcon className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isSelf ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                            {msg.attachment.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                getFileBadge(msg.attachment.name, msg.attachment.type).bg
                              }`}
                            >
                              {getFileBadge(msg.attachment.name, msg.attachment.type).label}
                            </span>
                            <span className={`text-[10px] ${isSelf ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>

                        {/* Download button */}
                        <button
                          type="button"
                          onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                          className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
                            isSelf
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Text Message Content */}
                    {msg.content && (
                      <p className={`text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        hasAttachment && isImage ? 'px-1 pt-1 pb-0.5' : ''
                      }`}>
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp & read checkmark */}
                    <div
                      className={`text-[10px] mt-1 flex items-center gap-1 select-none ${
                        hasAttachment && !msg.content ? 'px-1' : ''
                      } ${
                        isSelf ? 'justify-end text-indigo-100/90' : 'justify-end text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span>{formatTime(msg.created_at)}</span>
                      {isSelf && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUserName && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-11 py-1 animate-pulse">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{typingUserName}</span> is typing
            <span className="inline-flex gap-1 ml-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
          </div>
        )}

        <div ref={bottomAnchorRef} />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollButton && (
        <button
          id="btn-scroll-bottom"
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30 flex items-center justify-center cursor-pointer"
          title="Scroll to latest messages"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white border-b border-slate-800 mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-4">
              <h4 className="text-sm font-semibold truncate text-slate-100">
                {lightboxImage.name}
              </h4>
              <p className="text-xs text-slate-400">
                {formatFileSize(lightboxImage.size)} • {lightboxImage.type}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleDownloadAttachment(e, lightboxImage)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Download image"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image View */}
          <div
            className="relative max-h-[80vh] max-w-[90vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
