import { io } from 'socket.io-client';
import { readStoredAccessToken } from '../modules/auth/auth-storage';

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

export function connectSocketWithAuth() {
  const token = readStoredAccessToken();

  if (!token) {
    socket.disconnect();
    return;
  }

  socket.auth = { token };
  socket.connect();
}
