'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Profile,
  Conversation,
  Message,
  MessageAttachment,
  RealtimePresenceMember,
  ConnectionStatus,
} from '../../lib/types';
import {
  getCurrentAuthProfile,
  fetchRegisteredProfiles,
  fetchUserConversations,
  getOrCreateDirectConversation,
  fetchConversationMessages,
  sendChatMessage,
  broadcastTyping,
  subscribeToConversation,
  authSignOut,
  isProfileNameSetupNeeded,
} from '../../lib/insforge';
import ChatHeader from '../../components/ChatHeader';
import Sidebar from '../../components/Sidebar';
import MessageList from '../../components/MessageList';
import MessageInput from '../../components/MessageInput';
import SettingsModal from '../../components/SettingsModal';
import NameSetupModal from '../../components/NameSetupModal';
import { AlertCircle, X, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [registeredProfiles, setRegisteredProfiles] = useState<Profile[]>([]);
  const [onlinePresence, setOnlinePresence] = useState<RealtimePresenceMember[]>([]);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [sendError, setSendError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Authentication and Config Check
  useEffect(() => {
    async function initAuth() {
      const profile = await getCurrentAuthProfile();
      if (!profile) {
        // Protected route: Redirect unauthenticated users to /auth
        router.push('/auth?mode=login');
        return;
      }
      setCurrentProfile(profile);
      setIsLoaded(true);

      // Only show name setup if profile is genuinely incomplete (missing display name or username)
      if (isProfileNameSetupNeeded(profile)) {
        setShowNameModal(true);
      }
    }
    initAuth();
  }, [router]);

  // 2. Fetch conversations and registered users when authenticated
  const reloadConversations = useCallback(async (profileId: string) => {
    try {
      const convs = await fetchUserConversations(profileId);
      setConversations(convs);
      return convs;
    } catch (e) {
      console.warn('Error loading conversations:', e);
      return [];
    }
  }, []);

  const reloadRegisteredUsers = useCallback(async () => {
    try {
      const users = await fetchRegisteredProfiles();
      setRegisteredProfiles(users);
    } catch (e) {
      console.warn('Error loading registered users:', e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!currentProfile) return;

    fetchUserConversations(currentProfile.id).then((convs) => {
      if (active) {
        setConversations(convs);
        if (convs.length > 0 && !activeConversationId) {
          setActiveConversationId(convs[0].id);
        }
      }
    });

    fetchRegisteredProfiles().then((users) => {
      if (active) {
        setRegisteredProfiles(users);
      }
    });

    return () => {
      active = false;
    };
  }, [currentProfile, activeConversationId]);

  // 3. Load messages and subscribe to native InsForge Realtime on conversation change
  useEffect(() => {
    if (!activeConversationId || !currentProfile) {
      return;
    }

    let isSubscribed = true;

    // Load initial message history from database
    fetchConversationMessages(activeConversationId).then((history) => {
      if (isSubscribed) {
        setMessages(history);
      }
    });

    // Subscribe to InsForge WebSocket channel
    const unsubscribe = subscribeToConversation(activeConversationId, currentProfile, {
      onMessage: (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Update conversation's last message in the sidebar list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, lastMessage: newMsg, updated_at: newMsg.created_at }
              : c
          )
        );
      },
      onTyping: (userId, displayName) => {
        if (userId !== currentProfile.id) {
          setTypingUserName(displayName);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setTypingUserName(null);
          }, 3000);
        }
      },
      onPresenceChange: (presenceList) => {
        setOnlinePresence(presenceList);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [activeConversationId, currentProfile]);

  // 4. Send message handler
  const handleSendMessage = async (text: string, attachment?: MessageAttachment) => {
    if (!activeConversationId || !currentProfile) return;
    if (!text.trim() && !attachment) return;
    setSendError(null);

    const { message, error } = await sendChatMessage(
      activeConversationId,
      currentProfile.id,
      text,
      currentProfile,
      attachment
    );

    if (error || !message) {
      setSendError(error || 'Failed to send message.');
      return;
    }

    // Add to message feed (deduplicated against incoming realtime broadcast)
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });

    // Update conversation order and snippet in sidebar
    setConversations((prev) => {
      const targetConv = prev.find((c) => c.id === activeConversationId);
      if (!targetConv) return prev;
      const updated = {
        ...targetConv,
        lastMessage: message,
        updated_at: message.created_at,
      };
      return [updated, ...prev.filter((c) => c.id !== activeConversationId)];
    });
  };

  // 5. Start or reuse a direct conversation with a registered user
  const handleStartDirectConversation = async (targetProfile: Profile) => {
    if (!currentProfile) return;
    setSendError(null);

    try {
      const { conversationId, error } = await getOrCreateDirectConversation(
        currentProfile.id,
        targetProfile.id
      );

      if (error || !conversationId) {
        setSendError(error || 'Could not start conversation with user.');
        return;
      }

      await reloadConversations(currentProfile.id);
      setActiveConversationId(conversationId);
      setShowMobileSidebar(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start conversation.';
      console.error('Error starting conversation:', err);
      setSendError(msg);
    }
  };

  const handleTyping = () => {
    if (activeConversationId && currentProfile) {
      broadcastTyping(activeConversationId, currentProfile);
    }
  };

  // 6. Sign out handler: clear InsForge session and redirect to landing page
  const handleSignOut = async () => {
    await authSignOut();
    setCurrentProfile(null);
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setOnlinePresence([]);
    router.push('/');
  };

  const handleConfigUpdated = () => {
    if (currentProfile) {
      reloadConversations(currentProfile.id);
      reloadRegisteredUsers();
    }
  };

  // Find active conversation details
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeOtherProfile = activeConversation?.otherUser;
  const isOtherOnline = activeOtherProfile
    ? onlinePresence.some((p) => p.userId === activeOtherProfile.id && p.online)
    : false;

  // Loading state while checking session
  if (!isLoaded || !currentProfile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-xs font-medium">Connecting to Nexora Chat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          registeredProfiles={registeredProfiles}
          onStartDirectConversation={handleStartDirectConversation}
          currentProfile={currentProfile}
          onlinePresence={onlinePresence}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative z-50 flex-1 max-w-xs h-full bg-white dark:bg-[#090d16] shadow-2xl">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setShowMobileSidebar(false);
              }}
              registeredProfiles={registeredProfiles}
              onStartDirectConversation={handleStartDirectConversation}
              currentProfile={currentProfile}
              onlinePresence={onlinePresence}
              connectionStatus={connectionStatus}
            />
          </div>
        </div>
      )}

      {/* Main Chat Feed */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#070b12] transition-colors">
        <ChatHeader
          currentProfile={currentProfile}
          otherProfile={activeOtherProfile}
          isOnline={isOtherOnline}
          onOpenSettings={() => setShowSettings(true)}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setShowMobileSidebar(true)}
          onEditProfile={() => setShowNameModal(true)}
        />

        {/* Error notification banner if send failed */}
        {sendError && (
          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{sendError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Feed */}
        <MessageList
          messages={messages}
          currentProfile={currentProfile}
          otherProfile={activeOtherProfile}
          typingUserName={typingUserName}
        />

        {/* Message Input Box */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!activeConversationId}
          placeholder={
            !activeConversationId
              ? 'Select or start a conversation from the sidebar to send a message'
              : `Message ${activeOtherProfile?.display_name || 'chat'}...`
          }
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConfigUpdated={handleConfigUpdated}
      />

      {/* Name Setup Pop-up Modal (Only opened if incomplete profile or user clicked edit profile) */}
      {showNameModal && (
        <NameSetupModal
          isOpen={showNameModal}
          initialDisplayName={currentProfile?.display_name || ''}
          initialUsername={
            currentProfile?.username && !currentProfile.username.startsWith('user_')
              ? currentProfile.username
              : ''
          }
          onSuccess={(updated) => {
            setCurrentProfile(updated);
            setShowNameModal(false);
            reloadRegisteredUsers();
          }}
          onClose={() => setShowNameModal(false)}
        />
      )}
    </div>
  );
}
