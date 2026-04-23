export function resolveConfiguredNetworkUrl(
  configuredUrl: string | undefined,
  fallbackPath: string,
) {
  if (!configuredUrl) {
    return null;
  }

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  try {
    const resolvedUrl = new URL(configuredUrl);
    const currentHostname = window.location.hostname;
    const isConfiguredLocalhost =
      resolvedUrl.hostname === 'localhost' || resolvedUrl.hostname === '127.0.0.1';
    const isCurrentLocalhost =
      currentHostname === 'localhost' || currentHostname === '127.0.0.1';

    if (isConfiguredLocalhost && !isCurrentLocalhost) {
      resolvedUrl.hostname = currentHostname;
    }

    return resolvedUrl.toString().replace(/\/$/, '');
  } catch {
    return fallbackPath;
  }
}
