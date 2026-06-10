"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { currencies } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { AppSettings, saveSettings, clearAllData, exportAllData, importData } from "@/lib/storage";
import { exportBackup, importBackup, getAutoBackup } from "@/lib/backup";
import { checkPremiumAvailability, purchasePremium, restorePurchases, isPremiumUser } from "@/lib/premium";
import { isSupabaseConfigured, signIn, signUp, signOut as supaSignOut, getCurrentUser, syncToCloud, syncFromCloud } from "@/lib/supabase";
import {
  initGoogleDrive,
  requestGoogleAuth,
  isGoogleAuthenticated,
  revokeGoogleAccess,
  backupToGoogleDrive,
  restoreFromGoogleDrive,
  getGoogleDriveBackupTime,
  getGoogleClientId,
  setGoogleClientId,
} from "@/lib/gdrive";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Globe,
  Vibrate,
  Moon,
  Languages,
  Download,
  Upload,
  Trash2,
  Info,
  Shield,
  Cloud,
  CloudOff,
  RefreshCw,
  Save,
  RotateCcw,
  LogIn,
  LogOut,
  UserPlus,
  Clock,
  HardDrive,
  Key,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, refreshSettings, setCurrentCurrency, entries, customers, refreshEntries, refreshCustomers } = useAppStore();
  const t = translations[settings.language];
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Auto backup state
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Cloud sync state
  const [cloudUser, setCloudUser] = useState<{ email?: string } | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Google Drive state
  const [gdriveAuthenticated, setGdriveAuthenticated] = useState(false);
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [gdriveBackupTime, setGdriveBackupTime] = useState<string | null>(null);
  const [gdriveClientId, setGdriveClientIdLocal] = useState("");
  const [showGdriveSetup, setShowGdriveSetup] = useState(false);

  // Premium state
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumRestoring, setPremiumRestoring] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState<string | null>(null);
  const [premiumAvailable, setPremiumAvailable] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();

  // Load auto backup time
  useEffect(() => {
    const { time } = getAutoBackup();
    setLastBackupTime(time);
    const interval = setInterval(() => {
      const { time } = getAutoBackup();
      setLastBackupTime(time);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check cloud user
  useEffect(() => {
    if (supabaseConfigured) {
      getCurrentUser().then((user) => {
        setCloudUser(user);
      });
    }
  }, [supabaseConfigured]);

  // Check Google Drive state
  useEffect(() => {
    setGdriveAuthenticated(isGoogleAuthenticated());
    setGdriveBackupTime(getGoogleDriveBackupTime());
    const clientId = getGoogleClientId();
    if (clientId) {
      setGdriveClientIdLocal(clientId);
    }
  }, []);

  // Check Premium availability
  useEffect(() => {
    checkPremiumAvailability().then((info) => {
      setPremiumAvailable(info.available);
      if (info.price) {
        setPremiumPrice(info.price);
      }
    });
  }, []);

  const updateSetting = (key: keyof AppSettings, value: string | boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    refreshSettings();
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `note-counter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.exportData);
  };

  const handleManualBackup = () => {
    const data = exportBackup();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ncp-manual-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Manual backup exported!");
  };

  const handleRestoreBackup = () => {
    backupFileInputRef.current?.click();
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importBackup(text)) {
        refreshSettings();
        refreshEntries();
        refreshCustomers();
        toast.success("Backup restored successfully!");
      } else {
        toast.error("Restore failed - invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importData(text)) {
        refreshSettings();
        toast.success(t.importData);
      } else {
        toast.error("Import failed - invalid file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearAll = () => {
    clearAllData();
    refreshSettings();
    setShowClearConfirm(false);
    toast.success(t.clearAllData);
  };

  // Cloud auth handlers
  const handleCloudAuth = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email and password");
      return;
    }
    setCloudLoading(true);
    try {
      if (isSignUp) {
        const data = await signUp(loginEmail, loginPassword);
        if (data) {
          toast.success("Account created! Check email for verification.");
        }
      } else {
        const data = await signIn(loginEmail, loginPassword);
        if (data) {
          const user = await getCurrentUser();
          setCloudUser(user);
          toast.success("Signed in successfully!");
          setShowLoginDialog(false);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudSignOut = async () => {
    setCloudLoading(true);
    try {
      await supaSignOut();
      setCloudUser(null);
      toast.success("Signed out");
    } catch {
      toast.error("Sign out failed");
    } finally {
      setCloudLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncLoading(true);
    try {
      const success = await syncToCloud(entries, customers);
      if (success) {
        toast.success("Data synced to cloud!");
      } else {
        toast.error("Sync failed - please sign in first");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncFromCloud = async () => {
    setSyncLoading(true);
    try {
      const data = await syncFromCloud();
      if (data) {
        if (data.entries) {
          localStorage.setItem("note_counter_entries", JSON.stringify(data.entries));
        }
        if (data.customers) {
          localStorage.setItem("note_counter_customers", JSON.stringify(data.customers));
        }
        refreshEntries();
        refreshCustomers();
        toast.success("Data restored from cloud!");
      } else {
        toast.error("No cloud data found");
      }
    } catch {
      toast.error("Restore from cloud failed");
    } finally {
      setSyncLoading(false);
    }
  };

  // Google Drive handlers
  const handleGdriveSetup = async () => {
    if (!gdriveClientId) {
      toast.error("Please enter Google Client ID");
      return;
    }
    setGdriveLoading(true);
    try {
      setGoogleClientId(gdriveClientId);
      const initialized = await initGoogleDrive(gdriveClientId);
      if (initialized) {
        const authed = await requestGoogleAuth();
        if (authed) {
          setGdriveAuthenticated(true);
          toast.success("Google Drive connected!");
          setShowGdriveSetup(false);
        } else {
          toast.error("Google authentication failed");
        }
      } else {
        toast.error("Failed to initialize Google Drive");
      }
    } catch (err) {
      toast.error("Google Drive setup failed");
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleGdriveConnect = async () => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setShowGdriveSetup(true);
      return;
    }
    setGdriveLoading(true);
    try {
      await initGoogleDrive(clientId);
      const authed = await requestGoogleAuth();
      if (authed) {
        setGdriveAuthenticated(true);
        toast.success("Google Drive connected!");
      } else {
        toast.error("Google authentication failed");
      }
    } catch {
      toast.error("Connection failed");
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleGdriveBackup = async () => {
    setGdriveLoading(true);
    try {
      const result = await backupToGoogleDrive();
      if (result.success) {
        toast.success(result.message);
        setGdriveBackupTime(getGoogleDriveBackupTime());
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Google Drive backup failed");
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleGdriveRestore = async () => {
    setGdriveLoading(true);
    try {
      const result = await restoreFromGoogleDrive();
      if (result.success) {
        refreshEntries();
        refreshCustomers();
        refreshSettings();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Google Drive restore failed");
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleGdriveDisconnect = () => {
    revokeGoogleAccess();
    setGdriveAuthenticated(false);
    toast.success("Google Drive disconnected");
  };

  // Premium handlers
  const handlePurchasePremium = async () => {
    setPremiumLoading(true);
    try {
      const result = await purchasePremium();
      if (result.success) {
        refreshSettings();
        toast.success(t.premiumSuccess);
      } else {
        toast.error(t.premiumError);
      }
    } catch {
      toast.error(t.premiumError);
    } finally {
      setPremiumLoading(false);
    }
  };

  const handleRestorePremium = async () => {
    setPremiumRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.restored) {
        refreshSettings();
        toast.success(t.premiumRestored);
      } else {
        toast.error(t.premiumNotFound);
      }
    } catch {
      toast.error(t.premiumError);
    } finally {
      setPremiumRestoring(false);
    }
  };

  const formatBackupTime = (time: string | null) => {
    if (!time) return "Never";
    try {
      return new Date(time).toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-amber-400">{t.settings}</h2>

      <div className="space-y-3">
        {/* Default Currency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                    <Globe size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.defaultCurrency}</div>
                    <div className="text-xs text-white/40">Set default counting currency</div>
                  </div>
                </div>
                <Select
                  value={settings.defaultCurrency}
                  onValueChange={(v) => {
                    if (v) {
                      updateSetting("defaultCurrency", v);
                      setCurrentCurrency(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px] glass border-white/10 bg-white/5 text-amber-400 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vibration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                    <Vibrate size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.vibration}</div>
                    <div className="text-xs text-white/40">Haptic feedback on tap</div>
                  </div>
                </div>
                <Switch
                  checked={settings.vibration}
                  onCheckedChange={(checked) => updateSetting("vibration", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dark Mode */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                    <Moon size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.darkMode}</div>
                    <div className="text-xs text-white/40">Toggle dark/light theme</div>
                  </div>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting("darkMode", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-400/10 flex items-center justify-center">
                    <Languages size={16} className="text-pink-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.language}</div>
                    <div className="text-xs text-white/40">English / বাংলা</div>
                  </div>
                </div>
                <Select
                  value={settings.language}
                  onValueChange={(v) => { if (v) updateSetting("language", v); }}
                >
                  <SelectTrigger className="w-[100px] glass border-white/10 bg-white/5 text-amber-400 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bn">বাংলা</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium / Remove Ads */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
          <Card className={`border-2 ${settings.isPremium ? 'border-amber-400/40 glass' : 'border-amber-400/20 glass'}`}>
            <CardContent className="p-4 space-y-3">
              {settings.isPremium ? (
                // Already Premium
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
                    <Crown size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={14} /> {t.premiumOwned}
                    </div>
                    <div className="text-xs text-white/40">{t.premiumFeatures}</div>
                  </div>
                  <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
                </div>
              ) : (
                // Not Premium - Show Buy Option
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
                      <Crown size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-amber-400">{t.removeAds}</div>
                      <div className="text-xs text-white/40">{t.premiumDesc}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                      {t.premiumFeatures.split('·')[0]?.trim()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                      {t.premiumFeatures.split('·')[1]?.trim()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                      {t.premiumFeatures.split('·')[2]?.trim()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handlePurchasePremium}
                      disabled={premiumLoading}
                      className="flex-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 gap-2 font-bold"
                    >
                      {premiumLoading ? (
                        <>{t.premiumPurchasing}</>
                      ) : (
                        <>
                          <Crown size={14} />
                          {t.premiumBuy} {premiumPrice ? `(${premiumPrice})` : ''}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestorePremium}
                      disabled={premiumRestoring}
                      className="text-white/40 hover:bg-white/5 gap-1"
                    >
                      <RotateCcw size={12} className={premiumRestoring ? "animate-spin" : ""} />
                      <span className="text-xs">{t.premiumRestore}</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="bg-white/5" />

        {/* Auto Backup Section (Local) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                  <Clock size={16} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Auto Backup (Local)</div>
                  <div className="text-xs text-white/40">
                    Last backup: {formatBackupTime(lastBackupTime)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleManualBackup}
                  className="flex-1 text-cyan-400 hover:bg-cyan-400/10 gap-2"
                >
                  <Save size={14} /> Manual Backup
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRestoreBackup}
                  className="flex-1 text-orange-400 hover:bg-orange-400/10 gap-2"
                >
                  <RotateCcw size={14} /> Restore
                </Button>
              </div>
              <input
                ref={backupFileInputRef}
                type="file"
                accept=".json"
                onChange={handleBackupFileChange}
                className="hidden"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Google Drive Backup Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                  <HardDrive size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Google Drive Backup</div>
                  <div className="text-xs text-white/40">
                    {gdriveAuthenticated
                      ? `Connected · Last: ${formatBackupTime(gdriveBackupTime)}`
                      : "Connect to backup to Google Drive"
                    }
                  </div>
                </div>
                {gdriveAuthenticated && (
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                )}
              </div>

              {gdriveAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleGdriveBackup}
                      disabled={gdriveLoading}
                      className="flex-1 text-green-400 hover:bg-green-400/10 gap-2"
                    >
                      <RefreshCw size={14} className={gdriveLoading ? "animate-spin" : ""} /> Backup Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleGdriveRestore}
                      disabled={gdriveLoading}
                      className="flex-1 text-orange-400 hover:bg-orange-400/10 gap-2"
                    >
                      <Download size={14} /> Restore
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGdriveDisconnect}
                    className="w-full text-red-400 hover:bg-red-400/10 gap-2"
                  >
                    <LogOut size={14} /> Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const clientId = getGoogleClientId();
                      if (clientId) {
                        handleGdriveConnect();
                      } else {
                        setShowGdriveSetup(true);
                      }
                    }}
                    className="w-full text-green-400 hover:bg-green-400/10 gap-2"
                  >
                    <HardDrive size={14} /> Connect Google Drive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cloud Sync Section (Supabase) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
                  {supabaseConfigured ? (
                    <Cloud size={16} className="text-sky-400" />
                  ) : (
                    <CloudOff size={16} className="text-white/30" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Cloud Sync (Supabase)</div>
                  <div className="text-xs text-white/40">
                    {supabaseConfigured
                      ? cloudUser
                        ? `Signed in as ${cloudUser.email || "user"}`
                        : "Sign in to sync data"
                      : "Not configured - set env variables"
                    }
                  </div>
                </div>
              </div>

              {supabaseConfigured && (
                <>
                  {cloudUser ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSyncNow}
                          disabled={syncLoading}
                          className="flex-1 text-sky-400 hover:bg-sky-400/10 gap-2"
                        >
                          <RefreshCw size={14} className={syncLoading ? "animate-spin" : ""} /> Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSyncFromCloud}
                          disabled={syncLoading}
                          className="flex-1 text-orange-400 hover:bg-orange-400/10 gap-2"
                        >
                          <Download size={14} /> Pull Cloud
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCloudSignOut}
                        disabled={cloudLoading}
                        className="w-full text-red-400 hover:bg-red-400/10 gap-2"
                      >
                        <LogOut size={14} /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsSignUp(false);
                        setShowLoginDialog(true);
                      }}
                      className="w-full text-sky-400 hover:bg-sky-400/10 gap-2"
                    >
                      <LogIn size={14} /> Sign In
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="bg-white/5" />

        {/* Export */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                    <Download size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.exportData}</div>
                    <div className="text-xs text-white/40">Backup as JSON file</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleExport}
                  className="text-cyan-400 hover:bg-cyan-400/10"
                >
                  <Download size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center">
                    <Upload size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.importData}</div>
                    <div className="text-xs text-white/40">Restore from JSON backup</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleImport}
                  className="text-orange-400 hover:bg-orange-400/10"
                >
                  <Upload size={14} />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="bg-white/5" />

        {/* Clear All Data */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="glass border-red-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                    <Trash2 size={16} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-400">{t.clearAllData}</div>
                    <div className="text-xs text-white/40">{t.thisCannotBeUndone}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                <div>
                  <div className="text-sm font-medium text-white">{t.appInfo}</div>
                  <div className="text-xs text-white/40">{t.version}: 1.2.0</div>
                  <div className="text-xs text-white/30 mt-1">{t.about}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Shield size={18} /> {t.areYouSure}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/50">{t.thisCannotBeUndone}</p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 text-white/50"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleClearAll}
              className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              {t.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cloud Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sky-400 flex items-center gap-2">
              {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isSignUp ? "Create Account" : "Sign In"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button
              onClick={handleCloudAuth}
              disabled={cloudLoading}
              className="w-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
            >
              {cloudLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-xs text-white/40 hover:text-white/60 text-center"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Drive Setup Dialog */}
      <Dialog open={showGdriveSetup} onOpenChange={setShowGdriveSetup}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <HardDrive size={18} /> Connect Google Drive
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-white/50 space-y-2">
              <p>To use Google Drive backup, you need a Google Cloud Client ID.</p>
              <p className="text-white/30">1. Go to Google Cloud Console</p>
              <p className="text-white/30">2. Create a project & OAuth consent screen</p>
              <p className="text-white/30">3. Create OAuth 2.0 Client ID (Web application)</p>
              <p className="text-white/30">4. Add your redirect URI</p>
              <p className="text-white/30">5. Copy the Client ID below</p>
            </div>
            <Input
              placeholder="Google Client ID (e.g. xxx.apps.googleusercontent.com)"
              value={gdriveClientId}
              onChange={(e) => setGdriveClientIdLocal(e.target.value)}
              className="bg-white/5 border-white/10 text-white text-xs"
            />
            <Button
              onClick={handleGdriveSetup}
              disabled={gdriveLoading || !gdriveClientId}
              className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              {gdriveLoading ? "Connecting..." : "Connect & Authenticate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
