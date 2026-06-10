"use client";

import { useEffect, useState, memo, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { getSettings } from "@/lib/storage";
import { setupAutoBackup } from "@/lib/backup";
import CounterPage from "@/components/counter/CounterPage";
import CalcPage from "@/components/calc/CalcPage";
import BillingPage from "@/components/billing/BillingPage";
import KhataPage from "@/components/khata/KhataPage";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Calculator,
  Receipt,
  BookOpen,
  Settings,
} from "lucide-react";
import SettingsPage from "@/components/settings/SettingsPage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { App } from "@capacitor/app";

// ============ ADMOB HELPER ============
const ADMOB_BANNER_ID = 'ca-app-pub-1742730064755213/3078015084'
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-1742730064755213/1816904301'

// Check if running in Capacitor native app
function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

// AdMob Banner Component - renders natively, just reserves space in webview
const AdMobBanner = memo(function AdMobBanner() {
  const [bannerReady, setBannerReady] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return

    let mounted = true

    const initBanner = async () => {
      try {
        await AdMob.initialize({
          testingDevices: [''],
          initializeForTesting: true,
        })
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          isTesting: true,
        })
        if (mounted) setBannerReady(true)
      } catch (e) {
        console.log('AdMob banner error:', e)
      }
    }

    initBanner()

    return () => {
      mounted = false
      if (isNativeApp()) {
        AdMob.removeBanner().catch(() => {})
      }
    }
  }, [])

  return null // Banner is rendered natively by AdMob
})

// Show interstitial ad (call on tab transitions)
let interstitialLoaded = false
let lastInterstitialTime = 0

async function showInterstitialAd() {
  if (!isNativeApp()) return
  
  // Don't show more than once every 3 minutes
  const now = Date.now()
  if (now - lastInterstitialTime < 180000) return

  try {
    if (!interstitialLoaded) {
      await AdMob.prepareInterstitial({
        adId: ADMOB_INTERSTITIAL_ID,
        isTesting: true,
      })
      interstitialLoaded = true
    }
    await AdMob.showInterstitial()
    lastInterstitialTime = now
    interstitialLoaded = false
  } catch (e) {
    console.log('AdMob interstitial error:', e)
  }
}

const tabs = [
  { id: "counter", icon: Banknote, labelKey: "counter" as const, color: "#22c55e" },
  { id: "calc", icon: Calculator, labelKey: "calc" as const, color: "#eab308" },
  { id: "billing", icon: Receipt, labelKey: "billing" as const, color: "#3b82f6" },
  { id: "khata", icon: BookOpen, labelKey: "khata" as const, color: "#a855f7" },
];

export default function HomePage() {
  const { activeTab, setActiveTab, refreshEntries, refreshCustomers, refreshSettings, settings, setCurrentCurrency } = useAppStore();
  const t = translations[settings.language];
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const lastBackPressRef = useRef(0);

  // Hydrate store from localStorage on mount
  useEffect(() => {
    const storedSettings = getSettings();
    refreshSettings();
    refreshEntries();
    refreshCustomers();
    setCurrentCurrency(storedSettings.defaultCurrency);
    setupAutoBackup();
    setMounted(true);
  }, [refreshSettings, refreshEntries, refreshCustomers, setCurrentCurrency]);

  // Show interstitial ad on tab change
  useEffect(() => {
    if (mounted && activeTab !== 'counter') {
      showInterstitialAd()
    }
  }, [activeTab, mounted]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!isNativeApp()) return;

    const backButtonListener = App.addListener('backButton', () => {
      // If exit dialog is open, close it
      if (showExitDialog) {
        setShowExitDialog(false);
        return;
      }

      // If settings dialog is open, close it
      if (showSettings) {
        setShowSettings(false);
        return;
      }

      // If not on Counter tab, go back to Counter
      const currentTab = useAppStore.getState().activeTab;
      if (currentTab !== 'counter') {
        setActiveTab('counter');
        return;
      }

      // On Counter tab - show exit confirmation dialog
      setShowExitDialog(true);
    });

    return () => {
      backButtonListener.then(listener => listener.remove()).catch(() => {});
    };
  }, [showSettings, showExitDialog, setActiveTab]);
  useEffect(() => {
    if (mounted) {
      const html = document.documentElement;
      if (settings.darkMode) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
    }
  }, [settings.darkMode, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-amber-400 text-xl font-bold animate-pulse">Note Counter Pro</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "counter":
        return <CounterPage />;
      case "calc":
        return <CalcPage />;
      case "billing":
        return <BillingPage />;
      case "khata":
        return <KhataPage />;
      default:
        return <CounterPage />;
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${settings.darkMode ? 'bg-app-gradient' : 'bg-app-gradient-light'}`}>
      {/* AdMob Banner - at TOP, natively rendered */}
      <AdMobBanner />

      {/* App Header */}
      <header className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between glass-strong border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-amber-400 tracking-tight">
              {t.appName}
            </h1>
            <p className="text-[10px] text-white/40">Professional Cash Counter</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
        >
          <Settings size={18} />
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-1 min-h-0 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - FIXED at bottom */}
      <nav className="shrink-0 glass-strong border-t border-white/10 px-2 pb-safe" style={{ position: 'sticky', bottom: 0, zIndex: 40 }}>
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-0.5 min-w-[60px] py-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 w-10 h-1 rounded-full"
                    style={{ backgroundColor: tab.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`transition-colors ${
                    isActive ? "" : "text-white/40"
                  }`}
                  style={isActive ? { color: tab.color } : {}}
                />
                <span
                  className={`text-[11px] transition-colors font-bold ${
                    isActive ? "" : "text-white/40"
                  }`}
                  style={isActive ? { color: tab.color } : {}}
                >
                  {t[tab.labelKey]}
                </span>
              </button>
            );
          })}
          {/* Settings Button in Bottom Nav */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-0.5 min-w-[60px] py-1 relative"
          >
            <Settings
              size={22}
              className="text-white/40 hover:text-amber-400 transition-colors"
            />
            <span className="text-[11px] text-white/40 font-bold">
              {t.settings}
            </span>
          </button>
        </div>
      </nav>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className={`${settings.darkMode ? 'glass-strong border-white/10' : 'bg-white border-slate-200'} max-w-sm`}>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${settings.darkMode ? 'bg-red-500/20' : 'bg-red-50'}`}>
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className={`text-lg font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.exitApp || 'Exit App?'}
              </h3>
              <p className={`text-sm mt-1 ${settings.darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {t.exitAppMsg || 'Are you sure you want to exit?'}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExitDialog(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                  settings.darkMode
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.no || 'No'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowExitDialog(false);
                  App.exitApp();
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t.yes || 'Yes'}
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="glass-strong border-white/10 max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
          <SettingsPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}
