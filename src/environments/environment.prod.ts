export const environment = {
  production: true,
  // Same-origin proxy paths (see netlify.toml redirects). Routing auth + data
  // through this domain keeps the session cookie first-party so the installed
  // iOS PWA doesn't lose it to cross-site cookie blocking. Resolved to an
  // absolute URL against window.location.origin in NeonService.
  neonAuthUrl: '/__neon-auth',
  neonDataApiUrl: '/__neon-data',
  neonProjectId: 'wild-breeze-65639945',
};
