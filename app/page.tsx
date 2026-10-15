'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentAuthProfile } from '../lib/insforge';
import { Profile } from '../lib/types';
import ThemeToggle from '../components/ThemeToggle';
import {
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Database,
  ArrowRight,
  CheckCircle2,
  Users,
  Lock,
  ChevronRight,
  CheckCheck,
  Menu,
  X,
  Send,
  Smile,
  Activity,
  Layers,
  ChevronDown,
  Globe,
  Radio,
  FileCode,
  Heart,
  ThumbsUp,
  Flame,
  Check,
  Paperclip,
  Share2,
  Cpu,
  Server,
  ExternalLink,
  Camera,
  ShieldCheck,
} from 'lucide-react';

interface SimulatedMessage {
  id: string;
  sender: string;
  avatar: string;
  avatarBg: string;
  time: string;
  text: string;
  isMe?: boolean;
  reactions: { emoji: string; count: number; active?: boolean }[];
}

const CHANNELS: Record<
  string,
  {
    name: string;
    topic: string;
    online: number;
    latency: string;
    isDirect?: boolean;
    messages: SimulatedMessage[];
  }
> = {
  alex: {
    name: 'Alex Rivera',
    topic: 'Weekend rooftop café & farmers market plans ☕🥐',
    online: 2,
    latency: '4ms',
    isDirect: true,
    messages: [
      {
        id: 'msg-a1',
        sender: 'Alex Rivera',
        avatar: 'AR',
        avatarBg: 'bg-indigo-600',
        time: '12:04 PM',
        text: 'Hey! Are we still on for that new rooftop café downtown today? Just wrapped up my morning run 🏃‍♂️☕',
        reactions: [
          { emoji: '☕', count: 6, active: true },
          { emoji: '☀️', count: 4 },
          { emoji: '🙌', count: 3 },
        ],
      },
      {
        id: 'msg-a2',
        sender: 'Alex Rivera',
        avatar: 'AR',
        avatarBg: 'bg-indigo-600',
        time: '12:05 PM',
        text: 'The weather is so nice today — sunny and 72°! They have the outdoor patio seating open too ☀️🕶️',
        reactions: [
          { emoji: '❤️', count: 5 },
          { emoji: '✨', count: 4 },
        ],
      },
      {
        id: 'msg-a3',
        sender: 'You',
        avatar: 'ME',
        avatarBg: 'bg-indigo-600',
        time: '12:06 PM',
        text: "Count me in! Let's grab a patio table around 3:30 PM. I'll bring along that travel camera so we can test it out 📸✨",
        isMe: true,
        reactions: [
          { emoji: '🔥', count: 4 },
          { emoji: '🎉', count: 3 },
        ],
      },
    ],
  },
  sarah: {
    name: 'Sarah Chen',
    topic: 'Road trip cabin & sunset driving playlist 🚗🌲',
    online: 2,
    latency: '5ms',
    isDirect: true,
    messages: [
      {
        id: 'msg-s1',
        sender: 'Sarah Chen',
        avatar: 'SC',
        avatarBg: 'bg-violet-600',
        time: '11:20 AM',
        text: 'Cabin host just confirmed our weekend reservation! Key lockbox code is ready 🏡🔑',
        reactions: [
          { emoji: '🎉', count: 8, active: true },
          { emoji: '🏔️', count: 5 },
        ],
      },
      {
        id: 'msg-s2',
        sender: 'Sarah Chen',
        avatar: 'SC',
        avatarBg: 'bg-violet-600',
        time: '11:22 AM',
        text: 'I also finished curating our 4-hour road trip playlist with all those acoustic sunset tracks you liked 🎵✨',
        reactions: [
          { emoji: '🔥', count: 6 },
          { emoji: '❤️', count: 5 },
        ],
      },
      {
        id: 'msg-s3',
        sender: 'You',
        avatar: 'ME',
        avatarBg: 'bg-indigo-600',
        time: '11:25 AM',
        text: "You're the best! Hiking boots and board games are already packed. We hit the road Saturday at 8 AM sharp! 🎒🏔️",
        isMe: true,
        reactions: [
          { emoji: '🙌', count: 5 },
          { emoji: '🚗', count: 4 },
        ],
      },
    ],
  },
  weekend: {
    name: 'weekend-crew',
    topic: 'Friday dinner & movie night pick 🍕🎬',
    online: 4,
    latency: '6ms',
    isDirect: false,
    messages: [
      {
        id: 'msg-w1',
        sender: 'Alex Rivera',
        avatar: 'AR',
        avatarBg: 'bg-indigo-600',
        time: '6:15 PM',
        text: 'Alright debate time: woodfired pizza or ramen before the movie marathon tonight? 🍕🍜',
        reactions: [
          { emoji: '🍕', count: 7, active: true },
          { emoji: '🍜', count: 3 },
        ],
      },
      {
        id: 'msg-w2',
        sender: 'Sarah Chen',
        avatar: 'SC',
        avatarBg: 'bg-violet-600',
        time: '6:18 PM',
        text: '100% pizza! I already picked up the gourmet popcorn and salted caramel ice cream 🍿🍦',
        reactions: [
          { emoji: '❤️', count: 6 },
          { emoji: '✨', count: 4 },
        ],
      },
      {
        id: 'msg-w3',
        sender: 'You',
        avatar: 'ME',
        avatarBg: 'bg-indigo-600',
        time: '6:20 PM',
        text: 'Pizza it is! Setting up the 4K projector on the living room wall right now 🎬🙌',
        isMe: true,
        reactions: [
          { emoji: '🎉', count: 6 },
          { emoji: '🔥', count: 5 },
        ],
      },
    ],
  },
};

const FAQS = [
  {
    q: 'How does Nexora achieve sub-10ms message delivery?',
    a: 'Nexora utilizes a high-throughput bi-directional WebSocket pub/sub connection. Real-time messages are broadcasted immediately to room participants while asynchronously persisting to PostgreSQL with zero blocking overhead.',
  },
  {
    q: 'How does PostgreSQL Row-Level Security (RLS) protect conversations?',
    a: 'Every conversation query and live WebSocket subscription is verified against your authenticated JWT token. PostgreSQL applies database-level RLS policies, ensuring that users can strictly read and write messages only in conversations where they are verified members.',
  },
  {
    q: 'Are file and photo attachments supported?',
    a: 'Yes. Users can upload images, screenshots, and documents (PDF, DOCX, ZIP, code snippets) up to 15MB. The application generates rich image previews and downloadable file cards.',
  },
  {
    q: 'Does Nexora support OAuth providers like Google, GitHub, and Discord?',
    a: 'Yes. Nexora supports instant OAuth sign-in with Google, GitHub, and Discord in addition to standard email and password authentication, with seamless session persistence across all your devices.',
  },
  {
    q: 'Is Nexora responsive on mobile and tablet devices?',
    a: 'Absolutely. The entire UI is built with adaptive, touch-friendly layouts, smooth gestures, and responsive drawers that deliver a native-like experience on iOS, Android, and desktop browsers.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Live Chat Preview State (Reference 1)
  const [activeChannelKey, setActiveChannelKey] = useState<string>('alex');
  const [channelData, setChannelData] = useState(CHANNELS);
  const [inputMessage, setInputMessage] = useState('');
  const [isTypingSimulated, setIsTypingSimulated] = useState(true);
  const [quickReplyAdded, setQuickReplyAdded] = useState(false);

  // Interactive Experience Showcase Active Tab
  const [activeExperienceTab, setActiveExperienceTab] = useState(0);

  // Showcase reaction toggle state
  const [showcaseReactions, setShowcaseReactions] = useState<{ [emoji: string]: { count: number; active: boolean } }>({
    '❤️': { count: 24, active: true },
    '🔥': { count: 18, active: false },
    '🎉': { count: 31, active: true },
    '☕': { count: 12, active: false },
    '✨': { count: 15, active: false },
  });

  const handleToggleShowcaseReaction = (emoji: string) => {
    setShowcaseReactions((prev) => {
      const current = prev[emoji] || { count: 0, active: false };
      return {
        ...prev,
        [emoji]: {
          count: current.active ? current.count - 1 : current.count + 1,
          active: !current.active,
        },
      };
    });
  };

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await getCurrentAuthProfile();
        if (profile) {
          setCurrentUser(profile);
        }
      } catch (err) {
        console.warn('Auth check note:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Handle CTA routing
  const handleStartChatting = () => {
    if (currentUser) {
      router.push('/chat');
    } else {
      router.push('/auth?mode=signup');
    }
  };

  // Handle reaction click in chat demo
  const handleToggleReaction = (msgId: string, emoji: string) => {
    setChannelData((prev) => {
      const currentChan = prev[activeChannelKey];
      const updatedMessages = currentChan.messages.map((m) => {
        if (m.id !== msgId) return m;
        const exists = m.reactions.find((r) => r.emoji === emoji);
        let updatedReactions;
        if (exists) {
          updatedReactions = m.reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.active ? r.count - 1 : r.count + 1, active: !r.active }
              : r
          );
        } else {
          updatedReactions = [...m.reactions, { emoji, count: 1, active: true }];
        }
        return { ...m, reactions: updatedReactions.filter((r) => r.count > 0) };
      });
      return {
        ...prev,
        [activeChannelKey]: {
          ...currentChan,
          messages: updatedMessages,
        },
      };
    });
  };

  // Handle sending a message in the interactive demo
  const handleSendDemoMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend) return;

    const newMessage: SimulatedMessage = {
      id: `custom-${Date.now()}`,
      sender: currentUser?.display_name || 'You',
      avatar: currentUser?.display_name?.slice(0, 2).toUpperCase() || 'ME',
      avatarBg: 'bg-indigo-600',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
      isMe: true,
      reactions: [{ emoji: '⚡', count: 1, active: true }],
    };

    setChannelData((prev) => ({
      ...prev,
      [activeChannelKey]: {
        ...prev[activeChannelKey],
        messages: [...prev[activeChannelKey].messages, newMessage],
      },
    }));

    setInputMessage('');
    setQuickReplyAdded(true);
    setTimeout(() => setQuickReplyAdded(false), 2500);
  };

  const handleQuickChip = (text: string) => {
    setInputMessage(text);
  };

  const activeChannel = channelData[activeChannelKey];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden transition-colors duration-200">
      {/* Ambient background glow & subtle patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[54rem] h-[34rem] bg-gradient-to-tr from-indigo-300/30 via-violet-300/25 to-sky-200/30 dark:from-indigo-900/20 dark:via-violet-900/15 dark:to-sky-900/15 rounded-full blur-3xl opacity-75" />
        <div className="absolute top-1/3 -left-32 w-[30rem] h-[30rem] bg-indigo-200/30 dark:bg-indigo-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-[34rem] h-[34rem] bg-violet-200/30 dark:bg-violet-950/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: Spherix-Inspired Navigation Bar (Reference 3)             */}
      {/* ==================================================================== */}
      <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-indigo-950/30 px-4 sm:px-6 h-16 flex items-center justify-between transition-all">
          {/* Brand Logo & Descriptor */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Nexora <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Real-Time Messaging
              </span>
            </div>
          </Link>

          {/* Spherix-Style Center Nav Links (Pills container) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <a
              href="#hero"
              className="px-3.5 py-1.5 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-xs transition-all"
            >
              Home
            </a>
            <a
              href="#preview"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
            >
              Live Demo
            </a>
            <a
              href="#features"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
            >
              Features
            </a>
            <a
              href="#experience"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
            >
              Experience
            </a>
            <a
              href="#security"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
            >
              Security
            </a>
            <a
              href="#faq"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Controls: Live Status, Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live WebSocket Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>WebSocket Online</span>
            </div>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            {!isCheckingAuth && currentUser ? (
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <span>Open Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth?mode=login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Out Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1 text-sm font-medium">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Home
              </a>
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Live Demo
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Features
              </a>
              <a
                href="#experience"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Experience
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Security
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {!isCheckingAuth && currentUser ? (
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/25"
                >
                  Open Chat
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth?mode=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/25"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* SECTION 2: Hero Section with Live Chat Preview (Reference 1 & 4)     */}
      {/* ==================================================================== */}
      <section id="hero" className="relative z-10 pt-10 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines, Value Prop & CTAs */}
          <div className="lg:col-span-5 text-left space-y-6">
            {/* Small Product Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              <span>Real-Time Messaging & Collaboration</span>
            </div>

            {/* Main Bold Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Conversations that move at the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-300">
                speed of thought.
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Experience lightning-fast communication with our modern real-time chat platform.
              Sub-8ms WebSocket latency, live presence tracking, and cryptographic PostgreSQL Row-Level Security.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="hero-cta-start-chatting"
                onClick={handleStartChatting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
              >
                <span>{currentUser ? 'Open Chat Dashboard' : 'Start Chatting Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#features"
                className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                Explore Features
              </a>
            </div>

            {/* Verified Trust Badges */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>PostgreSQL RLS Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Sub-8ms Global Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Live Presence & Typing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Photos & File Sharing</span>
              </div>
            </div>
          </div>

          {/* Right Column: Large, Attractive, Realistic Live Chat Preview (Reference 1) */}
          <div id="preview" className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-300/50 dark:shadow-indigo-950/50 overflow-hidden transition-all">
              
              {/* Window Header with macOS Dots, Channels & Live Status */}
              <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                {/* macOS control dots */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>

                {/* Channel / DM Selector Pills */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  {Object.entries(channelData).map(([key, chan]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveChannelKey(key)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        activeChannelKey === key
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      {chan.isDirect ? (
                        <>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeChannelKey === key ? 'bg-emerald-300' : 'bg-emerald-500'
                            }`}
                          />
                          <span>{chan.name}</span>
                        </>
                      ) : (
                        <span>#{chan.name}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Right Latency & Online Badges */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{activeChannel.latency} Live Latency</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <Users className="w-3 h-3" />
                    <span>{activeChannel.online} {activeChannel.isDirect ? 'in chat' : 'friends'}</span>
                  </span>
                </div>
              </div>

              {/* Topic Banner */}
              <div className="px-4 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2 truncate">
                  <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Topic:</span>
                  <span className="truncate">{activeChannel.topic}</span>
                </div>
                <span className="hidden sm:inline-block text-[11px] text-indigo-600 dark:text-indigo-400 font-medium shrink-0">
                  Click reactions to test real-time feedback 👇
                </span>
              </div>

              {/* Messages Area */}
              <div className="p-4 sm:p-5 space-y-4 max-h-[360px] overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
                {activeChannel.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                      msg.isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!msg.isMe && (
                      <div
                        className={`w-9 h-9 rounded-2xl ${msg.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                      >
                        {msg.avatar}
                      </div>
                    )}

                    <div className={`max-w-[85%] sm:max-w-md ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl p-3.5 shadow-xs ${
                          msg.isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

                        {/* Delivery indicator */}
                        {msg.isMe && (
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-100 select-none">
                            <span>Delivered</span>
                            <CheckCheck className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Reaction Badges */}
                      <div className={`flex flex-wrap items-center gap-1.5 mt-1.5 px-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, r.emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer ${
                              r.active
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700 font-bold scale-105'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[11px]">{r.count}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, '❤️')}
                          className="px-1.5 py-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs transition-colors cursor-pointer"
                          title="Add reaction"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {msg.isMe && (
                      <div
                        className={`w-9 h-9 rounded-2xl ${msg.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                      >
                        {msg.avatar}
                      </div>
                    )}
                  </div>
                ))}

                {/* Simulated Typing Indicator */}
                {isTypingSimulated && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2 pt-1 animate-pulse">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {activeChannel.isDirect ? activeChannel.name : 'Alex Rivera'}
                    </span>{' '}
                    is typing
                    <span className="inline-flex gap-1 ml-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Reply Chips */}
              <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  QUICK REPLY:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickChip('☕ See you at 3:30!')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                >
                  ☕ See you at 3:30!
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('🍕 Count me in for pizza!')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                >
                  🍕 Count me in for pizza!
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('📸 Bringing the camera!')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                >
                  📸 Bringing the camera!
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('🚗 On my way now!')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                >
                  🚗 On my way now!
                </button>
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendDemoMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all">
                  <Smile className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      activeChannel.isDirect
                        ? `Message ${activeChannel.name}... (type and press Enter)`
                        : `Message #${activeChannel.name}... (type and press Enter)`
                    }
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Bottom Real App Launch Strip */}
              <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Want to chat with your friends in real-time with zero lag?</span>
                <button
                  type="button"
                  onClick={handleStartChatting}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Start Chatting Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3: Features Grid                                             */}
      {/* ==================================================================== */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Modern Collaboration Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineered for speed, built for privacy
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
            Everything your team needs for seamless, secure real-time messaging without the complexity of managing custom WebSocket infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              WebSocket Pub/Sub Mesh
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bi-directional message transmission delivers messages in under 8ms globally, with automated reconnect and message queue persistence.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              PostgreSQL Row-Level Security
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every message and channel membership is enforced at the database layer. No user can read or inject messages outside their authorized channels.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Presence & Typing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Keep teammates connected with live online/offline indicators and real-time typing indicators across multiple active tabs and devices.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Paperclip className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Photos & File Sharing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Share high-resolution images, screenshots, PDFs, and code snippets up to 15MB with full-screen lightbox viewing and one-click download.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Direct & Group Messaging
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Seamlessly start 1-on-1 direct conversations or collaborate in public team channels with search indexing and full message history.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-lg transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Cloud Sync &amp; History
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your message history, shared media attachments, and conversations stay safely synced across all your devices with zero data loss.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: Interactive Everyday Experience (Highlights & Delight)    */}
      {/* ==================================================================== */}
      <section id="experience" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span>Designed for Real Connection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Every conversation, made effortless and alive
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Whether you are catching up with close friends, sharing vacation memories, or planning weekend trips — experience a chat space with zero lag and zero clutter.
            </p>
          </div>

          {/* Experience Category Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[
              { title: '1. Instant Messaging', desc: 'Real-time chat & typing', icon: MessageSquare },
              { title: '2. Photos & Media', desc: 'HD uncompressed sharing', icon: Camera },
              { title: '3. Expressive Reactions', desc: 'One-tap emoji bursts', icon: Heart },
              { title: '4. Safe & Cozy Space', desc: 'Zero ads, total privacy', icon: ShieldCheck },
            ].map((step, idx) => {
              const IconComp = step.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveExperienceTab(idx)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    activeExperienceTab === idx
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComp
                      className={`w-4 h-4 ${
                        activeExperienceTab === idx
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold">{step.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{step.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Experience Showcase Content Panel */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            {activeExperienceTab === 0 && (
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Real-Time Sync</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Feels like talking in the exact same room
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Say goodbye to delayed notifications and awkward refresh buttons. With real-time WebSocket delivery, messages land on your friend's screen in under 8 milliseconds.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">4ms Latency</div>
                      <div className="text-slate-500 text-[11px]">Instant message delivery</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Multi-Device</div>
                      <div className="text-slate-500 text-[11px]">Synced across phone &amp; laptop</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alex Rivera</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Mobile · Active Now</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        AR
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl rounded-tl-xs text-xs text-slate-800 dark:text-slate-200">
                        Just arrived at the coffee shop! Got us that sunny corner table ☀️☕
                      </div>
                    </div>
                    <div className="flex items-start justify-end gap-2.5">
                      <div className="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-tr-xs text-xs">
                        Awesome! Be there in 3 minutes! 🏃‍♂️
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ME
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read instantly · 4ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeExperienceTab === 1 && (
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Rich Media Sharing</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Share your favorite moments in crisp HD
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Drop high-resolution photos, travel shots, and spontaneous moments directly into your conversation. With full-screen lightbox previews and up to 15MB file support, your memories stay crystal clear.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Original resolution with zero fuzzy compression</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Instant lightbox preview with responsive zoom</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Support for PNG, JPG, WebP, PDFs &amp; documents</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="h-28 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                      🌅 Sunset Rooftop
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">rooftop_sunset.jpg</span>
                      <span className="text-slate-400">4.2 MB</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="h-28 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                      🌲 Mountain Cabin
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">cabin_weekend.png</span>
                      <span className="text-slate-400">3.8 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeExperienceTab === 2 && (
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Lively Emoji Reactions</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Tap to react &amp; feel the vibe
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sometimes a single emoji says it all. Tap on any reaction below to test live interactive reactions. Give your friends real-time love, laughs, and excitement with bouncy micro-interactions.
                  </p>
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-800 dark:text-indigo-300">
                    💡 <strong>Try it now:</strong> Tap any emoji pill on the right to toggle your reaction!
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                        SC
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Sarah Chen</div>
                        <div className="text-[10px] text-slate-400">Today at 2:15 PM</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      &quot;I just booked our seaside Airbnb for the summer getaway! Private deck with ocean views and a campfire pit 🌊🔥🏕️&quot;
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {Object.entries(showcaseReactions).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleShowcaseReaction(emoji)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all transform active:scale-95 cursor-pointer ${
                            data.active
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-sm">{emoji}</span>
                          <span>{data.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeExperienceTab === 3 && (
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Your Private Haven</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    No ads, no algorithmic feeds, just your conversations
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Most messaging apps bombard you with noisy public channels, suggested reels, and targeted ads. Nexora is dedicated strictly to personal, meaningful communication between real people.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">100% Ad-Free</div>
                      <div className="text-slate-500 text-[11px]">No sponsored clutter or trackers</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">Strict Privacy</div>
                      <div className="text-slate-500 text-[11px]">Only room members see messages</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 font-bold text-slate-800 dark:text-slate-200">
                      <span>COMMUNITY PEACE OF MIND</span>
                      <span className="text-emerald-500">PROTECTED</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">Protected Direct &amp; Group Channels</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">Cryptographically Authenticated Sessions</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <Users className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">Total control over friends, members &amp; channels</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5: Security & Privacy Highlights                             */}
      {/* ==================================================================== */}
      <section id="security" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero-Trust Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Your conversations are private by design
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Nexora AI enforces Row-Level Security at the database layer. Even if a client attempt is crafted maliciously, PostgreSQL strictly drops unauthorized reads and writes before any execution happens.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Isolated conversation member permissions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cryptographic JWT token validation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Secure storage buckets with size &amp; type policies</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No plain-text credentials stored in browser</span>
              </li>
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-400">SECURITY AUDIT METRICS</span>
              <span className="text-xs text-emerald-400 font-bold">100% PASS</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">PostgreSQL RLS Isolation</span>
                <span className="font-mono text-emerald-400">Verified</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Cross-Tenant Leak Prevention</span>
                <span className="font-mono text-emerald-400">Zero Leaks</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">WebSocket Transport Encryption</span>
                <span className="font-mono text-emerald-400">WSS / TLS 1.3</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">OAuth Provider Compliance</span>
                <span className="font-mono text-emerald-400">OAuth 2.0 PKCE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 6: FAQ Accordion Section                                     */}
      {/* ==================================================================== */}
      <section id="faq" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 7: Final CTA Banner & Footer                                 */}
      {/* ==================================================================== */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-950 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl border border-indigo-800/50">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to experience modern real-time communication?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Start chatting immediately with our live deployment. Test multi-user conversations, file sharing, and instant presence.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleStartChatting}
                className="px-6 py-3 rounded-2xl bg-white text-indigo-950 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{currentUser ? 'Go to Chat' : 'Get Started Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            N
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Nexora AI</span>
          <span>— Real-Time Messaging Platform</span>
        </div>
        <div>
          © 2026 Nexora AI. Built with Next.js, PostgreSQL &amp; WebSockets.
        </div>
      </footer>
    </div>
  );
}
