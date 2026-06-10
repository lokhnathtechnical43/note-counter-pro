import { registerPlugin } from '@capacitor/core';

export interface PremiumProductInfo {
  available: boolean;
  productId?: string;
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
}

export interface RestoreResult {
  restored: boolean;
}

export interface PremiumPlugin {
  isPremiumAvailable(): Promise<PremiumProductInfo>;
  purchasePremium(): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
}

// Register the native plugin (only works on Android)
const PremiumNative = registerPlugin<PremiumPlugin>('PremiumPlugin');

export { PremiumNative };

// Check if running in native Android app
function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// Get premium status from storage
export function isPremiumUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const data = localStorage.getItem('ncp_settings');
    if (data) {
      const settings = JSON.parse(data);
      return !!settings.isPremium;
    }
  } catch {}
  return false;
}

// Set premium status
export function setPremiumStatus(premium: boolean): void {
  try {
    const data = localStorage.getItem('ncp_settings');
    const settings = data ? JSON.parse(data) : {};
    settings.isPremium = premium;
    localStorage.setItem('ncp_settings', JSON.stringify(settings));
  } catch {}
}

// Check premium availability (calls native plugin)
export async function checkPremiumAvailability(): Promise<PremiumProductInfo> {
  if (!isNativeApp()) {
    return { available: false };
  }
  try {
    return await PremiumNative.isPremiumAvailable();
  } catch {
    return { available: false };
  }
}

// Purchase premium (calls native plugin)
export async function purchasePremium(): Promise<PurchaseResult> {
  if (!isNativeApp()) {
    return { success: false };
  }
  try {
    const result = await PremiumNative.purchasePremium();
    if (result.success) {
      setPremiumStatus(true);
    }
    return result;
  } catch (error: any) {
    console.error('Purchase error:', error);
    return { success: false };
  }
}

// Restore purchases (calls native plugin)
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isNativeApp()) {
    return { restored: false };
  }
  try {
    const result = await PremiumNative.restorePurchases();
    if (result.restored) {
      setPremiumStatus(true);
    }
    return result;
  } catch {
    return { restored: false };
  }
}
