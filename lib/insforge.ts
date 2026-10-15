import { createClient, type InsForgeClient } from '@insforge/sdk';
import {
  Profile,
  Conversation,
  Message,
  MessageAttachment,
  RealtimePresenceMember,
  BackendConfig,
  ConnectionStatus,
} from './types';

const STORAGE_KEY_CONFIG = 'insforge_config';
const STORAGE_KEY_AUTH_USER = 'insforge_current_profile';

let activeClient: InsForgeClient | null = null;
let currentClientKey = '';

// Retrieve stored backend configuration (from environment variables or local overrides)
export function getStoredConfig(): BackendConfig {
  const envUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
  const envAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

  if (typeof window === 'undefined') {
    const isConfigured = Boolean(envUrl && envUrl !== 'https://your-app.region.insforge.app');
    return {
      baseUrl: envUrl || 'https://your-app.region.insforge.app',
      anonKey: envAnonKey,
      isConfigured,
    };
  }

  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const url = parsed.baseUrl || envUrl || 'https://your-app.region.insforge.app';
      const key = parsed.anonKey !== undefined ? parsed.anonKey : envAnonKey;
      const isConfigured = Boolean(url && url !== 'https://your-app.region.insforge.app');
      return { baseUrl: url, anonKey: key, isConfigured };
    } catch {
      // fallback
    }
  }

  const isConfigured = Boolean(envUrl && envUrl !== 'https://your-app.region.insforge.app');
  return {
    baseUrl: envUrl || 'https://your-app.region.insforge.app',
    anonKey: envAnonKey,
    isConfigured,
  };
}

export function saveStoredConfig(baseUrl: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ baseUrl, anonKey }));
  if (activeClient) {
    try {
      activeClient.realtime.disconnect();
    } catch {
      // ignore
    }
    activeClient = null;
  }
}

// Get or initialize singleton InsForge client
export function getInsForgeClient(): InsForgeClient | null {
  const config = getStoredConfig();
  if (!config.isConfigured) return null;

  const clientKey = `${config.baseUrl}::${config.anonKey}`;
  if (activeClient && currentClientKey === clientKey) {
    return activeClient;
  }

  try {
    activeClient = createClient({
      baseUrl: config.baseUrl,
      anonKey: config.anonKey || undefined,
    });
    currentClientKey = clientKey;
    return activeClient;
  } catch (err) {
    console.error('Failed to create InsForge SDK client:', err);
    return null;
  }
}

// ====================================================================
// Authentication Services
// ====================================================================

export async function authSignUp(
  email: string,
  password: string,
  username?: string,
  displayName?: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return {
      profile: null,
      error: 'InsForge backend is not configured. Please set NEXT_PUBLIC_INSFORGE_URL in .env.local or settings.',
    };
  }

  try {
    const rawName = displayName?.trim() || email.split('@')[0];
    // 1. Register user with InsForge Auth
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      name: rawName,
    });

    if (authError || !authData?.user) {
      return {
        profile: null,
        error: authError?.message || 'Failed to register account with InsForge Auth.',
      };
    }

    const userId = authData.user.id;

    // 2. Insert user profile into public.profiles
    const cleanUsername = username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${userId.substring(0, 8)}`;
    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: userId,
      username: cleanUsername,
      display_name: rawName,
      created_at: now,
      updated_at: now,
    };

    const { error: profileError } = await client.database
      .from('profiles')
      .insert([newProfile])
      .select();

    if (profileError) {
      console.warn('Profile creation note:', profileError.message);
    }

    // Persist current session profile locally
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(newProfile));
    }

    return { profile: newProfile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected sign-up error occurred.';
    console.error('Sign-up unexpected error:', err);
    return { profile: null, error: message };
  }
}

export async function updateAuthProfile(
  displayName: string,
  username: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return { profile: null, error: 'InsForge backend is not configured.' };
  }

  try {
    const { data: authData } = await client.auth.getCurrentUser();
    let userId = authData?.user?.id;

    if (!userId && typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          userId = parsed.id;
        } catch {
          // ignore
        }
      }
    }

    if (!userId) {
      return { profile: null, error: 'Active session not found. Please sign in again.' };
    }

    const cleanDisplayName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanDisplayName) {
      return { profile: null, error: 'Please enter your display name.' };
    }
    if (!cleanUsername) {
      return { profile: null, error: 'Please enter a valid username (letters, numbers, underscores).' };
    }
    if (cleanUsername.length < 3) {
      return { profile: null, error: 'Username must be at least 3 characters long.' };
    }

    // Check if username is already taken by another user
    const { data: existingUsers, error: checkError } = await client.database
      .from('profiles')
      .select('id, username')
      .eq('username', cleanUsername);

    if (!checkError && existingUsers && existingUsers.length > 0) {
      const takenByOther = existingUsers.some((u: { id: string }) => u.id !== userId);
      if (takenByOther) {
        return { profile: null, error: 'This username is already taken. Please choose another username.' };
      }
    }

    const now = new Date().toISOString();
    const updatedProfile: Profile = {
      id: userId,
      username: cleanUsername,
      display_name: cleanDisplayName,
      created_at: now,
      updated_at: now,
    };

    const { data: savedData, error: saveError } = await client.database
      .from('profiles')
      .upsert([updatedProfile])
      .select();

    if (saveError) {
      return { profile: null, error: saveError.message || 'Failed to update profile name.' };
    }

    const finalProfile = savedData && savedData[0] ? (savedData[0] as Profile) : updatedProfile;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(finalProfile));
      localStorage.setItem(`nexora_name_completed_${userId}`, 'true');
    }

    return { profile: finalProfile, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile.';
    return { profile: null, error: msg };
  }
}

export function isProfileNameSetupNeeded(profile: Profile | null): boolean {
  if (!profile) return false;
  // A profile only requires completion if display_name or username is genuinely missing/blank
  const hasDisplayName = Boolean(profile.display_name && profile.display_name.trim().length > 0);
  const hasUsername = Boolean(profile.username && profile.username.trim().length > 0);
  return !hasDisplayName || !hasUsername;
}

export async function authSignIn(
  email: string,
  password: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return {
      profile: null,
      error: 'InsForge backend is not configured. Please configure your backend endpoint.',
    };
  }

  try {
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      return {
        profile: null,
        error: authError?.message || 'Invalid credentials or user not found.',
      };
    }

    const userId = authData.user.id;

    // Fetch user profile from public.profiles
    const { data: profiles } = await client.database
      .from('profiles')
      .select('*')
      .eq('id', userId);

    let profile: Profile;

    if (profiles && profiles.length > 0) {
      profile = profiles[0] as Profile;
    } else {
      // Profile does not exist yet (e.g., initial migration), create it
      const now = new Date().toISOString();
      const userProfile = authData.user.profile as { name?: string } | null;
      const fallbackName = userProfile?.name || email.split('@')[0];
      profile = {
        id: userId,
        username: fallbackName.toLowerCase().replace(/\s+/g, '_') || `user_${userId.substring(0, 8)}`,
        display_name: fallbackName,
        created_at: now,
        updated_at: now,
      };

      await client.database.from('profiles').upsert([profile]).select();
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(profile));
    }

    return { profile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed.';
    console.error('Sign-in error:', err);
    return { profile: null, error: message };
  }
}

export async function authSignInOAuth(
  provider: 'google' | 'github' | 'discord',
  redirectTo?: string
): Promise<{ url?: string; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return {
      error: 'InsForge backend is not configured. Please configure your backend endpoint.',
    };
  }

  try {
    const callbackUrl =
      redirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback');

    const res = await client.auth.signInWithOAuth(provider, {
      redirectTo: callbackUrl,
    });

    if (res.error) {
      return { error: res.error.message || `Failed to initiate ${provider} OAuth.` };
    }

    return { url: res.data?.url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to sign in with ${provider}.`;
    console.error(`${provider} OAuth error:`, err);
    return { error: message };
  }
}

export async function handleOAuthCallback(
  code?: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return {
      profile: null,
      error: 'InsForge backend is not configured.',
    };
  }

  try {
    if (code) {
      try {
        const exchangeRes = await client.auth.exchangeOAuthCode(code);
        if (exchangeRes.error) {
          console.warn('OAuth code exchange note:', exchangeRes.error.message);
        }
      } catch (exchangeErr) {
        console.warn('OAuth exchange note:', exchangeErr);
      }
    }

    // Retrieve authenticated user from InsForge Auth
    const { data: authData, error: userError } = await client.auth.getCurrentUser();
    if (userError || !authData?.user) {
      return {
        profile: null,
        error: userError?.message || 'Failed to retrieve authenticated session from OAuth.',
      };
    }

    const authUser = authData.user;
    const userId = authUser.id;

    // Fetch or create profile in public.profiles
    const { data: profiles } = await client.database
      .from('profiles')
      .select('*')
      .eq('id', userId);

    let profile: Profile;

    if (profiles && profiles.length > 0) {
      profile = profiles[0] as Profile;
    } else {
      const userProfile = authUser.profile as { name?: string; avatar_url?: string } | null;
      const fallbackName = userProfile?.name || authUser.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
      const cleanUsername = fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_') || `user_${userId.substring(0, 8)}`;
      const now = new Date().toISOString();

      profile = {
        id: userId,
        username: cleanUsername,
        display_name: fallbackName,
        created_at: now,
        updated_at: now,
      };

      const { error: upsertErr } = await client.database
        .from('profiles')
        .upsert([profile])
        .select();

      if (upsertErr) {
        console.warn('Profile upsert note:', upsertErr.message);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(profile));
    }

    return { profile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth callback processing failed.';
    console.error('handleOAuthCallback error:', err);
    return { profile: null, error: message };
  }
}

export async function authSignOut(): Promise<void> {
  const client = getInsForgeClient();
  if (client) {
    try {
      client.realtime.disconnect();
      await client.auth.signOut();
    } catch (e) {
      console.warn('Sign-out error:', e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

export async function getCurrentAuthProfile(): Promise<Profile | null> {
  if (typeof window === 'undefined') return null;

  const client = getInsForgeClient();
  if (!client) {
    const cached = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    const { data: authData, error: authError } = await client.auth.getCurrentUser();
    if (authError || !authData?.user) {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      return null;
    }

    const userId = authData.user.id;
    const { data: profiles } = await client.database
      .from('profiles')
      .select('*')
      .eq('id', userId);

    if (profiles && profiles.length > 0) {
      const p = profiles[0] as Profile;
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(p));
      return p;
    }

    // Automatically provision profile row for OAuth or newly authenticated users
    const userProfile = authData.user.profile as { name?: string } | null;
    const fallbackName = userProfile?.name || authData.user.email?.split('@')[0] || 'User';
    const fallbackProfile: Profile = {
      id: userId,
      username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_') || `user_${userId.substring(0, 8)}`,
      display_name: fallbackName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await client.database.from('profiles').upsert([fallbackProfile]);
    } catch (upsertErr) {
      console.warn('Auto-provision profile warning:', upsertErr);
    }

    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(fallbackProfile));
    return fallbackProfile;
  } catch (e) {
    console.warn('Get current auth profile error:', e);
    const cached = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ====================================================================
// Database Services (Profiles, Conversations, Messages)
// ====================================================================

// ====================================================================
// Attachment & Message Serialization Helpers
// ====================================================================

/**
 * Parses raw message content. If the content is serialized JSON containing
 * an attachment, extracts the plain text content and the attachment object.
 */
export function parseMessageContent(raw: Message): Message {
  if (!raw || !raw.content) return raw;
  try {
    const trimmed = raw.content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && ('attachment' in parsed || 'text' in parsed)) {
        return {
          ...raw,
          content: typeof parsed.text === 'string' ? parsed.text : '',
          attachment: (parsed.attachment as MessageAttachment) || undefined,
        };
      }
    }
  } catch {
    // Non-JSON or standard text message
  }
  return raw;
}

/**
 * Serializes text and optional attachment for PostgreSQL storage.
 * Ensures the resulting payload is non-empty to satisfy database CHECK constraints.
 */
export function encodeMessageContent(text?: string, attachment?: MessageAttachment): string {
  if (attachment) {
    return JSON.stringify({
      text: text?.trim() || '',
      attachment,
    });
  }
  return text?.trim() || '';
}

/**
 * Compresses an image in browser via canvas to optimize transfer size and storage.
 */
function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Canvas compression only supported in browser'));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };
    img.src = objectUrl;
  });
}

/**
 * Converts a File or Blob into a Data URL string.
 */
async function fileToDataUrl(file: File): Promise<string> {
  if (
    typeof window !== 'undefined' &&
    file.type.startsWith('image/') &&
    file.size > 1024 * 1024 &&
    !file.type.includes('gif') &&
    !file.type.includes('svg')
  ) {
    try {
      const compressed = await compressImage(file);
      if (compressed) return compressed;
    } catch {
      // fallback to regular FileReader
    }
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an attachment (image, pdf, doc, etc.) for chat.
 * Tries InsForge Storage bucket "chat-attachments" first.
 * If storage bucket is not created or fails, falls back to optimized Base64 data URL
 * so sending attachments always succeeds out of the box with real-time capability!
 */
export async function uploadChatAttachment(
  file: File
): Promise<{ attachment: MessageAttachment | null; error: string | null }> {
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB max
  if (file.size > MAX_FILE_SIZE) {
    return {
      attachment: null,
      error: `File size exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`,
    };
  }

  const client = getInsForgeClient();

  // 1. Try InsForge Storage bucket if configured
  if (client) {
    try {
      const bucket = client.storage.from('chat-attachments');
      const { data, error } = await bucket.uploadAuto(file);
      if (!error && data?.url) {
        return {
          attachment: {
            url: data.url,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
          },
          error: null,
        };
      }
    } catch (storageErr) {
      console.warn('InsForge storage upload attempt note:', storageErr);
    }
  }

  // 2. Fallback to optimized Data URL
  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      attachment: {
        url: dataUrl,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
      },
      error: null,
    };
  } catch (convErr) {
    const msg = convErr instanceof Error ? convErr.message : 'Failed to process attachment';
    return { attachment: null, error: msg };
  }
}

// Fetch all registered users to start conversations with
export async function fetchRegisteredProfiles(): Promise<Profile[]> {
  const client = getInsForgeClient();
  if (!client) return [];

  try {
    const { data, error } = await client.database
      .from('profiles')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching registered profiles:', error);
      return [];
    }

    return (data || []) as Profile[];
  } catch (err) {
    console.error('fetchRegisteredProfiles catch:', err);
    return [];
  }
}

// Fetch all conversations for the current user with details
export async function fetchUserConversations(currentUserId: string): Promise<Conversation[]> {
  const client = getInsForgeClient();
  if (!client) return [];

  try {
    // 1. Find all conversations the user is a member of
    const { data: memberRows, error: memberError } = await client.database
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (memberError || !memberRows || memberRows.length === 0) {
      return [];
    }

    const conversationIds = memberRows.map((r: { conversation_id: string }) => r.conversation_id);

    // 2. Fetch conversations
    const { data: convRows, error: convError } = await client.database
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (convError || !convRows) {
      return [];
    }

    // 3. For each conversation, fetch the other participant's profile and last message
    const conversationsWithDetails: Conversation[] = [];

    for (const conv of convRows) {
      // Find other member
      const { data: otherMembers } = await client.database
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conv.id)
        .neq('user_id', currentUserId)
        .limit(1);

      let otherProfile: Profile | undefined = undefined;
      if (otherMembers && otherMembers.length > 0) {
        const otherUserId = (otherMembers[0] as { user_id: string }).user_id;
        const { data: profiles } = await client.database
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .limit(1);
        if (profiles && profiles.length > 0) {
          otherProfile = profiles[0] as Profile;
        }
      }

      // Find last message
      const { data: lastMsgs } = await client.database
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = lastMsgs && lastMsgs.length > 0 ? parseMessageContent(lastMsgs[0] as Message) : undefined;

      conversationsWithDetails.push({
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        otherUser: otherProfile,
        lastMessage,
      });
    }

    return conversationsWithDetails;
  } catch (err) {
    console.error('fetchUserConversations error:', err);
    return [];
  }
}

// Get existing direct conversation between two users, or create a new one
export async function getOrCreateDirectConversation(
  currentUserId: string,
  targetUserId: string
): Promise<{ conversationId: string | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return { conversationId: null, error: 'InsForge backend is not configured.' };
  }

  try {
    // 1. Check if direct conversation already exists
    const { data: myMemberships } = await client.database
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (myMemberships && myMemberships.length > 0) {
      const myConvIds = myMemberships.map((m: { conversation_id: string }) => m.conversation_id);

      // Check which of these conversations also has targetUserId
      const { data: matchingMemberships } = await client.database
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', myConvIds);

      if (matchingMemberships && matchingMemberships.length > 0) {
        // Conversation already exists! Reuse it
        return { conversationId: (matchingMemberships[0] as { conversation_id: string }).conversation_id, error: null };
      }
    }

    // 2. Create a new conversation
    const now = new Date().toISOString();
    const { data: newConv, error: createError } = await client.database
      .from('conversations')
      .insert([{ created_by: currentUserId, created_at: now, updated_at: now }])
      .select();

    if (createError || !newConv || newConv.length === 0) {
      return { conversationId: null, error: createError?.message || 'Failed to create conversation' };
    }

    const conversationId = (newConv[0] as { id: string }).id;

    // 3. Add both members to conversation_members
    const membersToInsert = [
      { conversation_id: conversationId, user_id: currentUserId },
      { conversation_id: conversationId, user_id: targetUserId },
    ];

    const { error: membersError } = await client.database
      .from('conversation_members')
      .insert(membersToInsert)
      .select();

    if (membersError) {
      return { conversationId: null, error: membersError.message };
    }

    return { conversationId, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating conversation';
    console.error('getOrCreateDirectConversation error:', err);
    return { conversationId: null, error: message };
  }
}

// Fetch conversation history from messages table
export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  const client = getInsForgeClient();
  if (!client) return [];

  try {
    const { data: msgs, error } = await client.database
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !msgs) {
      console.error('fetchConversationMessages error:', error);
      return [];
    }

    // Fetch sender profile details for each message
    const messageRows = msgs as Message[];
    const senderIds = Array.from(new Set(messageRows.map((m) => m.sender_id)));
    const profilesMap = new Map<string, Profile>();

    if (senderIds.length > 0) {
      const { data: profiles } = await client.database
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      ((profiles || []) as Profile[]).forEach((p) => profilesMap.set(p.id, p));
    }

    return messageRows.map((m) => {
      const parsed = parseMessageContent(m);
      return {
        ...parsed,
        sender: profilesMap.get(m.sender_id),
      };
    });
  } catch (err) {
    console.error('fetchConversationMessages catch:', err);
    return [];
  }
}

// Persist message in database and publish via InsForge Realtime
export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  content: string,
  senderProfile?: Profile,
  attachment?: MessageAttachment
): Promise<{ message: Message | null; error: string | null }> {
  const client = getInsForgeClient();
  if (!client) {
    return { message: null, error: 'InsForge backend is not connected.' };
  }

  const trimmed = content.trim();
  if (!trimmed && !attachment) {
    return { message: null, error: 'Message cannot be empty.' };
  }

  const serializedContent = encodeMessageContent(trimmed, attachment);

  try {
    // 1. Persist message in the messages table
    const { data, error } = await client.database
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content: serializedContent,
        },
      ])
      .select();

    if (error || !data || data.length === 0) {
      return { message: null, error: error?.message || 'Failed to persist message in database.' };
    }

    const inserted = data[0] as {
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
    };

    const savedMessage: Message = {
      id: inserted.id,
      conversation_id: inserted.conversation_id,
      sender_id: inserted.sender_id,
      content: trimmed,
      attachment,
      created_at: inserted.created_at,
      sender: senderProfile,
    };

    // 2. Update conversation updated_at timestamp
    void Promise.resolve(
      client.database
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    );

    // 3. Publish to InsForge Realtime channel
    const channelName = `conversation:${conversationId}`;
    if (client.realtime.isConnected) {
      client.realtime
        .publish(channelName, 'new_message', savedMessage)
        .catch((e) => console.warn('Realtime publish warning:', e));
    }

    return { message: savedMessage, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send message.';
    console.error('sendChatMessage error:', err);
    return { message: null, error: message };
  }
}

// Broadcast typing indicator
export function broadcastTyping(conversationId: string, currentProfile: Profile) {
  const client = getInsForgeClient();
  if (!client || !client.realtime.isConnected) return;

  const channelName = `conversation:${conversationId}`;
  client.realtime
    .publish(channelName, 'user_typing', {
      userId: currentProfile.id,
      username: currentProfile.username,
      displayName: currentProfile.display_name,
    })
    .catch(() => {});
}

// ====================================================================
// Real-time Subscriptions (Native InsForge WebSockets)
// ====================================================================

interface SocketPayloadMessage {
  id?: string;
  conversation_id?: string;
  sender_id?: string;
  content?: string;
  attachment?: MessageAttachment;
  created_at?: string;
  sender?: Profile;
}

interface SocketPayloadTyping {
  userId?: string;
  username?: string;
  displayName?: string;
}

interface RealtimeMemberRaw {
  presenceId?: string;
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  name?: string;
}

export function subscribeToConversation(
  conversationId: string,
  currentProfile: Profile,
  callbacks: {
    onMessage: (message: Message) => void;
    onTyping?: (userId: string, displayName: string) => void;
    onPresenceChange?: (members: RealtimePresenceMember[]) => void;
    onStatusChange?: (status: ConnectionStatus) => void;
  }
): () => void {
  const client = getInsForgeClient();
  if (!client) {
    callbacks.onStatusChange?.('error');
    return () => {};
  }

  const channelName = `conversation:${conversationId}`;
  callbacks.onStatusChange?.('connecting');

  // Event handlers
  const messageHandler = (payload: unknown) => {
    const msg = payload as SocketPayloadMessage;
    if (msg && msg.id && msg.conversation_id && msg.sender_id && msg.created_at) {
      const parsed = parseMessageContent(msg as Message);
      callbacks.onMessage(parsed);
    }
  };

  const typingHandler = (payload: unknown) => {
    const typing = payload as SocketPayloadTyping;
    if (typing && typing.userId && typing.userId !== currentProfile.id) {
      callbacks.onTyping?.(typing.userId, typing.displayName || typing.username || 'User');
    }
  };

  const syncPresenceState = () => {
    if (!callbacks.onPresenceChange) return;
    const state = client.realtime.getPresenceState(channelName) as RealtimeMemberRaw[];
    const members: RealtimePresenceMember[] = state.map((m) => ({
      presenceId: m.presenceId,
      userId: m.userId || m.id || m.presenceId || 'unknown',
      username: m.username,
      displayName: m.displayName || m.name,
      online: true,
    }));
    callbacks.onPresenceChange(members);
  };

  const presenceJoinHandler = () => {
    syncPresenceState();
  };

  const presenceLeaveHandler = () => {
    syncPresenceState();
  };

  // Register listeners on client realtime
  client.realtime.on('new_message', messageHandler);
  client.realtime.on('user_typing', typingHandler);
  client.realtime.on('presence:join', presenceJoinHandler);
  client.realtime.on('presence:leave', presenceLeaveHandler);

  // Connect and subscribe to channel
  client.realtime
    .connect()
    .then(() => {
      callbacks.onStatusChange?.('connected');
      return client.realtime.subscribe(channelName);
    })
    .then((subResponse) => {
      if (subResponse.ok) {
        syncPresenceState();
      }
    })
    .catch((err) => {
      console.warn('InsForge Realtime connect/subscribe warning:', err);
      callbacks.onStatusChange?.('disconnected');
    });

  // Cleanup function on unmount or conversation change
  return () => {
    try {
      client.realtime.off('new_message', messageHandler);
      client.realtime.off('user_typing', typingHandler);
      client.realtime.off('presence:join', presenceJoinHandler);
      client.realtime.off('presence:leave', presenceLeaveHandler);
      client.realtime.unsubscribe(channelName);
    } catch (e) {
      console.warn('Realtime cleanup note:', e);
    }
  };
}
