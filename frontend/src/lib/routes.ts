export const APP_ROUTES = {
  home: '/',
  access: '/portal',
  workspace: '/workspace',
  archive: '/archive',
  monitor: '/monitor',
  overview: '/overview',
  insights: '/insights',
  control: '/control',
  controlActivity: '/control/activity',
} as const;

export const LEGACY_ROUTE_REDIRECTS = [
  { from: '/login', to: APP_ROUTES.access },
  { from: '/captures', to: APP_ROUTES.workspace },
  { from: '/captures/history', to: APP_ROUTES.archive },
  { from: '/region', to: APP_ROUTES.monitor },
  { from: '/admin', to: APP_ROUTES.overview },
  { from: '/director', to: APP_ROUTES.insights },
  { from: '/superadmin', to: APP_ROUTES.control },
  { from: '/superadmin/audit', to: APP_ROUTES.controlActivity },
] as const;
