import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokhnathtechnical.dailylifepro',
  appName: 'DailyLife Pro',
  webDir: 'out',
  // Server URL - will load from Vercel deployment
  server: {
    // TODO: Replace with your Vercel deployment URL after deploying
    url: 'https://dailylife-pro.vercel.app',
    // Allow navigation to external URLs if needed
    allowNavigation: ['dailylife-pro.vercel.app'],
  },
  // Android specific settings
  android: {
    // Allow mixed content (HTTP resources on HTTPS page)
    allowMixedContent: false,
  },
  // Plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#fbbf24',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;
