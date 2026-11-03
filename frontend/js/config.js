// Attend AI — Frontend Configuration
// Uses environment-injected or runtime configuration without hardcoding private secrets.

export const APP_CONFIG = {
  appName: 'Attend AI',
  tagline: 'Find the Bug. Fix the Code. Improve Your Skills.',
  apiBaseUrl: '/api',
  supabaseUrl: window.__ATTEND_SUPABASE_URL__ || '',
  supabasePublishableKey: window.__ATTEND_SUPABASE_PUBLISHABLE_KEY__ || '',
};
