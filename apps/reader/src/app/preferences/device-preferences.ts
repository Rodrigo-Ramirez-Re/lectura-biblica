/**
 * Per-device preferences (theme, notices seen) live in localStorage, not IndexedDB: they are read
 * synchronously at start-up and are not part of backups. Keys are namespaced because every project
 * site of the account shares the github.io origin.
 */
const PREFIX = 'lectura-biblica.';

export function readDevicePreference(name: string): string | null {
  try {
    return localStorage.getItem(PREFIX + name);
  } catch {
    return null;
  }
}

export function writeDevicePreference(name: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + name, value);
  } catch {
    // Storage blocked (private mode): the choice still applies until the page is closed.
  }
}
