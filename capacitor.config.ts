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
    AdMob: {
      appId: 'ca-app-pub-1742730064755213~7771104412',
      bannerAdId: 'ca-app-pub-1742730064755213/6662912587',
      interstitialAdId: 'ca-app-pub-1742730064755213/6471340896',
      isTesting: false,
    },
  },
};

export default config;
