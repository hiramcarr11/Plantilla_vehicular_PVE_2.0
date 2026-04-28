import { io } from 'socket.io-client';
import { readStoredAccessToken } from '../modules/auth/auth-storage';
import { resolveConfiguredNetworkUrl } from './resolve-network-url';

function resolveSocketUrl() {
  const configuredSocketUrl = resolveConfiguredNetworkUrl(import.meta.env.VITE_SOCKET_URL, '/');

  if (configuredSocketUrl) {
    return configuredSocketUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3101';
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3101`;
}

const SOCKET_URL = resolveSocketUrl();
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

socket.on('connect', () => {
  reconnectAttempts = 0;
});

socket.on('disconnect', () => {
  reconnectAttempts = 0;
});

socket.on('connect_error', () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts += 1;
  }
});

export function connectSocket() {
  const token = readStoredAccessToken();

  if (!token) {
    return;
  }

  if (socket.connected) {
    return;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts = 0;
    return;
  }

  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  reconnectAttempts = 0;
  socket.removeAllListeners();
  socket.disconnect();
}

export function resetSocketReconnectAttempts() {
  reconnectAttempts = 0;
}
