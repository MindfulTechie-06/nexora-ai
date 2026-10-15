'use client';

import React, { useState } from 'react';
import { Profile, Conversation, Message, RealtimePresenceMember, ConnectionStatus } from '../lib/types';
import { MessageSquare, Users, Search, Plus, Radio, Sparkles } from 'lucide-react';
import Link from 'next/link';

function formatLastMessageSnippet(msg?: Message): string {
  if (!msg) return '';
  if (msg.attachment) {
    const isImg = msg.attachment.type.startsWith('image/');
    const prefix = isImg ? '📷 Photo' : `📎 ${msg.attachment.name}`;
    if (msg.content && msg.content.trim()) {
      return `${prefix}: ${msg.content.trim()}`;
    }
    return prefix;
  }
  return msg.content || '';
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  registeredProfiles: Profile[];
  onStartDirectConversation: (targetProfile: Profile) => void;
  currentProfile: Profile;
  onlinePresence: RealtimePresenceMember[];
  connectionStatus: ConnectionStatus;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  registeredProfiles,
  onStartDirectConversation,
  currentProfile,
  onlinePresence,
  connectionStatus,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Check if a specific profile is online based on presence state
  const isUserOnline = (userId: string) => {
    if (userId === currentProfile.id) return true;
    return onlinePresence.some((p) => p.userId === userId && p.online);
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

  // Exclude current user from the contact list to show available users to message
  const otherProfiles = registeredProfiles.filter((p) => p.id !== currentProfile.id);

  // Filter conversations and contacts based on search query
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.otherUser?.display_name || '';
    const username = c.otherUser?.username || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  const filteredContacts = otherProfiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const name = p.display_name || '';
    const username = p.username || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  return (
    <aside className="w-80 bg-white dark:bg-[#090d16] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col h-full shrink-0 select-none transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Nexora <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Real-Time Messaging
            </div>
          </div>
        </Link>

        {/* Real-time connection status pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
              : connectionStatus === 'connecting'
              ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'
          }`}
          title={`WebSocket Status: ${connectionStatus}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Search Input Field */}
      <div className="p-3 border-b border-slate-200/90 dark:border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations or users..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>
      </div>

      {/* Conversations Section */}
      <div className="px-3 py-3 border-b border-slate-200/90 dark:border-slate-800/80 flex-1 max-h-[50%] flex flex-col">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            Conversations
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {filteredConversations.length}
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              <p className="font-semibold text-slate-600 dark:text-slate-400">
                {searchQuery ? 'No matching conversations' : 'No active conversations'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {searchQuery ? 'Try a different search term' : 'Click any registered user below to chat'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              const other = conv.otherUser;
              const online = other ? isUserOnline(other.id) : false;
              const name = other?.display_name || 'Direct Conversation';

              return (
                <button
                  key={conv.id}
                  id={`btn-conv-${conv.id}`}
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {getInitials(name)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ${
                        isActive ? 'ring-indigo-600' : 'ring-white dark:ring-slate-950'
                      } ${online ? 'bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{name}</span>
                    </div>
                    {conv.lastMessage && (
                      <span
                        className={`block text-[11px] truncate mt-0.5 ${
                          isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {formatLastMessageSnippet(conv.lastMessage)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Registered Users / Contacts List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 flex flex-col">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-500" />
            Registered Users
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
            {otherProfiles.filter((p) => isUserOnline(p.id)).length} online
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/30 text-slate-400 text-xs">
              {searchQuery ? 'No contacts match your query.' : 'No other users registered yet.'}
            </div>
          ) : (
            filteredContacts.map((user) => {
              const online = isUserOnline(user.id);

              return (
                <button
                  key={user.id}
                  id={`user-item-${user.id}`}
                  type="button"
                  onClick={() => onStartDirectConversation(user)}
                  className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900/90 transition-colors group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold group-hover:border-indigo-500">
                        {getInitials(user.display_name)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-950 ${
                          online ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {user.display_name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                        @{user.username}
                      </div>
                    </div>
                  </div>

                  <span className="opacity-0 group-hover:opacity-100 text-[10px] px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-bold transition-opacity shrink-0">
                    Chat
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
