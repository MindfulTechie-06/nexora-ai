export interface Profile {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  otherUser?: Profile;
  lastMessage?: Message;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment?: MessageAttachment;
  sender?: Profile;
}

export interface RealtimePresenceMember {
  presenceId?: string;
  userId: string;
  username?: string;
  displayName?: string;
  online: boolean;
  lastPing?: number;
}

export interface BackendConfig {
  baseUrl: string;
  anonKey: string;
  isConfigured: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
