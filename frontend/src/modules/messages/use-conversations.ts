import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import type { Conversation, Message, User } from '../../types';
import { useAuth } from '../auth/auth-context';

const SOCKET_DEBUG_ENABLED = import.meta.env.VITE_SOCKET_DEBUG === 'true';

function conversationsDebugLog(event: string, payload?: Record<string, unknown>) {
  if (!SOCKET_DEBUG_ENABLED) {
    return;
  }

  if (payload) {
    console.info(`[conversations] ${event}`, payload);
    return;
  }

  console.info(`[conversations] ${event}`);
}

export function useConversations() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const loaded = await api.getConversations(session.accessToken);
      setConversations(loaded);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;

    void loadConversations();

    const handleNewMessage = (message: Message) => {
      conversationsDebugLog('messages:new_received', {
        messageId: message.id,
        conversationId: message.conversation.id,
      });

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.id === message.conversation.id,
        );

        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount:
              message.sender.id === session.user.id
                ? existing.unreadCount ?? 0
                : (existing.unreadCount ?? 0) + 1,
          };
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessageAt ?? 0).getTime() -
              new Date(a.lastMessageAt ?? 0).getTime(),
          );
        }

        return prev;
      });
    };

    const handleConversationUpdated = () => {
      conversationsDebugLog('conversations:updated_received');
      void loadConversations();
    };

    const handleConversationRead = (payload: { conversationId: string }) => {
      conversationsDebugLog('conversations:read_received', payload);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      );
    };

    socket.on('messages:new', handleNewMessage);
    socket.on('conversations:updated', handleConversationUpdated);
    socket.on('conversations:read', handleConversationRead);

    return () => {
      socket.off('messages:new', handleNewMessage);
      socket.off('conversations:updated', handleConversationUpdated);
      socket.off('conversations:read', handleConversationRead);
    };
  }, [session]);

  return {
    conversations,
    loading,
    refresh: loadConversations,
  };
}
