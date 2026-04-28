import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { socket } from '../../../lib/socket';
import type { Message } from '../../../types';
import { useAuth } from '../../auth/auth-context';

function playMessageAlertTone() {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  try {
    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.08);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.24);

    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    // Browsers can block autoplay audio. Ignore silently and keep the visual notification.
  }
}

export function MessageNotification() {
  const { session } = useAuth();
  const notificationShownRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!session) return;

    const handleNewMessage = (message: Message) => {
      if (message.sender.id === session.user.id) return;

      const messageId = message.id;

      if (notificationShownRef.current[messageId]) return;

      notificationShownRef.current[messageId] = true;
      playMessageAlertTone();

      const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
      const hasPhotos = message.photos && message.photos.length > 0;
      const contentPreview =
        message.content.length > 50
          ? message.content.substring(0, 50) + '...'
          : message.content;

      let messageHtml = `<strong>${senderName}</strong> te envio un mensaje:`;
      if (hasPhotos) {
        messageHtml += `<br/><p style="margin-top: 6px; color: #6b7280;">${message.photos.length} foto(s) adjunta(s)</p>`;
      }
      if (contentPreview) {
        messageHtml += `<p style="margin-top: 10px; font-style: italic;">${contentPreview}</p>`;
      }

      void Swal.fire({
        icon: 'info',
        title: hasPhotos ? 'Nuevo mensaje con foto(s)' : 'Nuevo mensaje',
        html: messageHtml,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    };

    socket.on('messages:new', handleNewMessage);

    return () => {
      socket.off('messages:new', handleNewMessage);
    };
  }, [session]);

  return null;
}
