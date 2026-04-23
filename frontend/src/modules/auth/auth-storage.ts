const ACCESS_TOKEN_STORAGE_KEY = 'vehicle-control-access-token';
const LEGACY_STORAGE_KEYS = ['vehicle-control-session'];

export function clearLegacyAuthStorage() {
  LEGACY_STORAGE_KEYS.forEach((storageKey) => {
    window.sessionStorage.removeItem(storageKey);
    window.localStorage.removeItem(storageKey);
  });
}

export function readStoredAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function writeStoredAccessToken(accessToken: string) {
  window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearStoredAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
