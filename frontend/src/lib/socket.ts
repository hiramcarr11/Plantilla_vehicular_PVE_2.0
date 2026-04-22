import { io } from 'socket.io-client';

function resolveSocketUrl() {
  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;

  if (configuredSocketUrl) {
    return configuredSocketUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3000`;
}

const SOCKET_URL = resolveSocketUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
