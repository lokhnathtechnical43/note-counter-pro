import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokhnathtechnical.notecounterpro',
  appName: 'Note Counter Pro',
  webDir: 'out',
  // NO server.url - this makes the app work offline by bundling files locally
  android: {
    allowMixedContent: false,
  },
  // Removed androidScheme: 'https' to improve compatibility with older Android WebView versions
  // The default 'http://' scheme works more reliably across all devices
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
      appId: 'ca-app-pub-1742730064755213~6546486804',
      bannerAdId: 'ca-app-pub-1742730064755213/3078015084',
      interstitialAdId: 'ca-app-pub-1742730064755213/1816904301',
      isTesting: true,
    },
  },
};

export default config;
