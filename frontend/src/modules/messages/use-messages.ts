import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import type { Message } from '../../types';
import { useAuth } from '../auth/auth-context';

export function useMessages(conversationId: string | null) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const initializedRef = useRef(false);

  const loadMessages = useCallback(async () => {
    if (!session || !conversationId) return;

    setLoading(true);
    try {
      const loaded = await api.getConversationMessages(
        conversationId,
        session.accessToken,
      );
      setMessages(loaded);
      initializedRef.current = true;
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, session]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      initializedRef.current = false;
      return;
    }

    void loadMessages();
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversation.id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('messages:new', handleNewMessage);

    return () => {
      socket.off('messages:new', handleNewMessage);
    };
  }, [conversationId]);

  const sendMessage = async (content: string, photos: File[] = []) => {
    if (!session || !conversationId) return;
    if (!content.trim() && photos.length === 0) return;

    setSending(true);
    try {
      if (photos.length > 0) {
        await api.sendMessageWithPhotos(
          conversationId,
          content.trim(),
          photos,
          session.accessToken,
        );
      } else {
        await api.sendMessage(conversationId, content.trim(), session.accessToken);
      }
      void loadMessages();
    } catch (error) {
      throw error;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!session) return;

    try {
      await api.markMessageAsRead(messageId, session.accessToken);
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    if (!session || !conversationId) return;

    try {
      await api.markConversationAsRead(conversationId, session.accessToken);
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isRead: true, readAt: new Date().toISOString() })),
      );
    } catch {
      // Silently fail
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refresh: loadMessages,
  };
}
