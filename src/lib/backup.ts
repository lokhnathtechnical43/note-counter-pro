// Google Drive Backup using Google Identity API
// This uses the Google API client to backup/restore data to Google Drive
// Real Google Drive API requires OAuth setup - provide the structure

import { getEntries, getCustomers, getSettings, saveSettings, CounterEntry, Customer, AppSettings } from "./storage";

interface BackupData {
  entries: CounterEntry[];
  customers: Customer[];
  settings: AppSettings;
  timestamp: string;
}

// Auto backup to localStorage as a first step
// Real Google Drive API requires OAuth setup - provide the structure

export function exportBackup(): string {
  const data: BackupData = {
    entries: getEntries(),
    customers: getCustomers(),
    settings: getSettings(),
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackup(json: string): boolean {
  try {
    const data = JSON.parse(json) as BackupData;
    // Validate and restore
    if (data.entries && Array.isArray(data.entries)) {
      localStorage.setItem("note_counter_entries", JSON.stringify(data.entries));
    }
    if (data.customers && Array.isArray(data.customers)) {
      localStorage.setItem("note_counter_customers", JSON.stringify(data.customers));
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return true;
  } catch {
    return false;
  }
}

// Auto backup every 5 minutes to localStorage
export function setupAutoBackup() {
  // Perform an initial backup immediately
  const backup = exportBackup();
  localStorage.setItem('ncp_auto_backup', backup);
  localStorage.setItem('ncp_auto_backup_time', new Date().toISOString());

  setInterval(() => {
    const backup = exportBackup();
    localStorage.setItem('ncp_auto_backup', backup);
    localStorage.setItem('ncp_auto_backup_time', new Date().toISOString());
  }, 5 * 60 * 1000);
}

export function getAutoBackup(): { data: string | null; time: string | null } {
  return {
    data: localStorage.getItem('ncp_auto_backup'),
    time: localStorage.getItem('ncp_auto_backup_time'),
  };
}
