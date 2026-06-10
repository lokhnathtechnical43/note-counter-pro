// Google Drive Backup using Google Identity Services + Google Drive API
// This uses browser-based OAuth to backup/restore data to Google Drive
// No server needed - works entirely client-side

import { getEntries, getCustomers, getSettings, saveSettings, CounterEntry, Customer, AppSettings } from "./storage";

interface BackupData {
  entries: CounterEntry[];
  customers: Customer[];
  settings: AppSettings;
  timestamp: string;
  version: string;
}

const GDRIVE_FOLDER_NAME = "NoteCounterPro";
const GDRIVE_FILE_NAME = "ncp-backup.json";
const BACKUP_MIME_TYPE = "application/json";

// Google API scope for Drive file access
const SCOPES = "https://www.googleapis.com/auth/drive.file";

// Token client interface (local type to avoid google namespace issues)
interface GTokenClient {
  client_id?: string;
  requestAccessToken: (config: { prompt: string }) => void;
}

// Token client reference
let tokenClient: GTokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Check if Google API is loaded
function isGoogleApiLoaded(): boolean {
  return typeof window !== "undefined" && !!window.google?.accounts?.oauth2;
}

// Initialize Google Identity Services
export function initGoogleDrive(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!clientId) {
      resolve(false);
      return;
    }

    if (isGoogleApiLoaded()) {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
            if (response.error) {
              console.error("Google auth error:", response.error);
              resolve(false);
              return;
            }
            if (response.access_token) {
              accessToken = response.access_token;
              tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
              resolve(true);
            } else {
              resolve(false);
            }
          },
        });
        resolve(!!tokenClient);
      } catch (e) {
        console.error("Failed to init Google token client:", e);
        resolve(false);
      }
    } else {
      // Load Google API script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => {
        try {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
              if (response.error) {
                console.error("Google auth error:", response.error);
                resolve(false);
                return;
              }
              if (response.access_token) {
                accessToken = response.access_token;
                tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
                resolve(true);
              } else {
                resolve(false);
              }
            },
          });
          resolve(!!tokenClient);
        } catch (e) {
          console.error("Failed to init Google token client:", e);
          resolve(false);
        }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
}

// Request access token (opens popup for user consent)
export function requestGoogleAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tokenClient) {
      resolve(false);
      return;
    }

    // If token is still valid, skip re-auth
    if (accessToken && Date.now() < tokenExpiry) {
      resolve(true);
      return;
    }

    // Override callback for this request
    const originalClient = tokenClient;
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: originalClient.client_id || "",
        scope: SCOPES,
        callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
          if (response.error) {
            console.error("Google auth error:", response.error);
            resolve(false);
            return;
          }
          if (response.access_token) {
            accessToken = response.access_token;
            tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
            resolve(true);
          } else {
            resolve(false);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch {
      resolve(false);
    }
  });
}

// Check if authenticated with Google
export function isGoogleAuthenticated(): boolean {
  return !!accessToken && Date.now() < tokenExpiry;
}

// Revoke Google access
export function revokeGoogleAccess() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
  tokenExpiry = 0;
}

// Helper: Make Google Drive API request
async function driveApiRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  if (!accessToken) throw new Error("Not authenticated with Google");

  const url = path.startsWith("http")
    ? path
    : `https://www.googleapis.com/drive/v3${path}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API error: ${response.status} - ${errorText}`);
  }

  // Some responses may be empty
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return null;
}

// Find or create the app folder in Google Drive
async function getOrCreateFolder(): Promise<string> {
  // Search for existing folder
  const searchResult = (await driveApiRequest(
    "GET",
    `/files?q=name='${GDRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id,name)`
  )) as { files: { id: string; name: string }[] };

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

  // Create folder
  const createResult = (await driveApiRequest("POST", "/files", {
    name: GDRIVE_FOLDER_NAME,
    mimeType: "application/vnd.google-apps.folder",
  })) as { id: string };

  return createResult.id;
}

// Find existing backup file in the folder
async function findBackupFile(folderId: string): Promise<string | null> {
  const searchResult = (await driveApiRequest(
    "GET",
    `/files?q=name='${GDRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false&spaces=drive&fields=files(id,name,modifiedTime)`
  )) as { files: { id: string; name: string; modifiedTime: string }[] };

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }
  return null;
}

// Export backup data
function createBackupData(): BackupData {
  return {
    entries: getEntries(),
    customers: getCustomers(),
    settings: getSettings(),
    timestamp: new Date().toISOString(),
    version: "1.2.0",
  };
}

// Upload backup to Google Drive
export async function backupToGoogleDrive(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isGoogleAuthenticated()) {
      const authed = await requestGoogleAuth();
      if (!authed) return { success: false, message: "Google authentication failed" };
    }

    const folderId = await getOrCreateFolder();
    const backupData = createBackupData();
    const backupJson = JSON.stringify(backupData, null, 2);

    const existingFileId = await findBackupFile(folderId);

    if (existingFileId) {
      // Update existing file using multipart upload
      const metadata = {
        name: GDRIVE_FILE_NAME,
      };
      const boundary = "-------314159265358979323846";
      const bodyParts = [
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
        `--${boundary}\r\nContent-Type: ${BACKUP_MIME_TYPE}\r\n\r\n${backupJson}`,
        `--${boundary}--`,
      ].join("\r\n");

      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: bodyParts,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update backup: ${response.status}`);
      }
    } else {
      // Create new file using multipart upload
      const metadata = {
        name: GDRIVE_FILE_NAME,
        parents: [folderId],
      };
      const boundary = "-------314159265358979323846";
      const bodyParts = [
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
        `--${boundary}\r\nContent-Type: ${BACKUP_MIME_TYPE}\r\n\r\n${backupJson}`,
        `--${boundary}--`,
      ].join("\r\n");

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: bodyParts,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create backup: ${response.status}`);
      }
    }

    // Save last backup time
    localStorage.setItem("ncp_gdrive_backup_time", new Date().toISOString());

    return { success: true, message: "Backup saved to Google Drive!" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    console.error("Google Drive backup error:", message);
    return { success: false, message };
  }
}

// Restore backup from Google Drive
export async function restoreFromGoogleDrive(): Promise<{ success: boolean; message: string; data?: BackupData }> {
  try {
    if (!isGoogleAuthenticated()) {
      const authed = await requestGoogleAuth();
      if (!authed) return { success: false, message: "Google authentication failed" };
    }

    const folderId = await getOrCreateFolder();
    const fileId = await findBackupFile(folderId);

    if (!fileId) {
      return { success: false, message: "No backup found on Google Drive" };
    }

    // Download file content
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download backup: ${response.status}`);
    }

    const json = await response.text();
    const data = JSON.parse(json) as BackupData;

    // Validate data structure
    if (!data.entries || !Array.isArray(data.entries)) {
      return { success: false, message: "Invalid backup data format" };
    }

    // Restore data to localStorage
    if (data.entries) {
      localStorage.setItem("note_counter_entries", JSON.stringify(data.entries));
    }
    if (data.customers) {
      localStorage.setItem("note_counter_customers", JSON.stringify(data.customers));
    }
    if (data.settings) {
      saveSettings(data.settings);
    }

    return { success: true, message: "Data restored from Google Drive!", data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed";
    console.error("Google Drive restore error:", message);
    return { success: false, message };
  }
}

// Get last Google Drive backup time
export function getGoogleDriveBackupTime(): string | null {
  return localStorage.getItem("ncp_gdrive_backup_time");
}

// Auto backup to Google Drive (if configured and authenticated)
let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

export function setupGoogleDriveAutoBackup(clientId: string, intervalMinutes: number = 30) {
  // Clear existing interval
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
  }

  // Store client ID for later use
  localStorage.setItem("ncp_gdrive_client_id", clientId);

  // Initial backup attempt (silent, won't prompt if not authed)
  if (isGoogleAuthenticated()) {
    backupToGoogleDrive().catch(console.error);
  }

  // Set up periodic backup
  autoBackupInterval = setInterval(async () => {
    if (isGoogleAuthenticated()) {
      try {
        await backupToGoogleDrive();
      } catch (e) {
        console.error("Auto Google Drive backup failed:", e);
      }
    }
  }, intervalMinutes * 60 * 1000);
}

export function stopGoogleDriveAutoBackup() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
}

// Check if Google Drive is configured
export function isGoogleDriveConfigured(): boolean {
  const clientId = typeof window !== "undefined"
    ? localStorage.getItem("ncp_gdrive_client_id") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    : "";
  return !!clientId;
}

// Get Google Client ID from env or localStorage
export function getGoogleClientId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ncp_gdrive_client_id") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}

// Set Google Client ID (for runtime configuration)
export function setGoogleClientId(clientId: string) {
  localStorage.setItem("ncp_gdrive_client_id", clientId);
}

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => GTokenClient;
          revoke: (token: string) => void;
        };
      };
    };
  }
}
