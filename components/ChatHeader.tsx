'use client';

import React from 'react';
import { Profile } from '../lib/types';
import { Settings, LogOut, Menu, User, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface ChatHeaderProps {
  currentProfile: Profile;
  otherProfile?: Profile;
  isOnline: boolean;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  onEditProfile?: () => void;
}

export default function ChatHeader({
  currentProfile,
  otherProfile,
  isOnline,
  onOpenSettings,
  onSignOut,
  onToggleSidebar,
  onEditProfile,
}: ChatHeaderProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between shrink-0 z-20 transition-colors">
      {/* Left: Mobile hamburger & Active Conversation info */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle sidebar"
            aria-label="Toggle conversation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 min-w-0">
          {otherProfile ? (
            <>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/20">
                  {getInitials(otherProfile.display_name)}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {otherProfile.display_name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isOnline ? 'Active now' : 'Offline'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  @{otherProfile.username}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Nexora AI Chat
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Select a user or conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle, User Chip, Settings & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Theme Toggle */}
        <ThemeToggle />

        {/* Current User Chip (Clickable to edit profile name/handle willingly) */}
        <button
          id="btn-header-profile"
          type="button"
          onClick={onEditProfile}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer group"
          title="Click to edit your display name and handle"
          aria-label="Edit your profile"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
              {getInitials(currentProfile.display_name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {currentProfile.display_name}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-[100px] font-mono">
              @{currentProfile.username}
            </div>
          </div>
        </button>

        {/* Settings button */}
        <button
          id="btn-header-settings"
          type="button"
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title="Backend & Schema Setup"
          aria-label="Settings and Database Schema"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Sign Out button */}
        <button
          id="btn-header-signout"
          type="button"
          onClick={onSignOut}
          className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
