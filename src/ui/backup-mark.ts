import { useEffect, useState } from 'preact/hooks';
import { diffDays, todayIso, type IsoDate } from '../core/date';

const KEY = 'uplatnica.lastBackupAt';
const EVENT = 'uplatnica-backup';

export const BACKUP_REMIND_DAYS = 30;

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function markBackup(now: Date): void {
  try {
    localStorage.setItem(KEY, now.toISOString());
  } catch {
    return;
  }
  dispatchEvent(new Event(EVENT));
}

/** Days since the last full export, or null if there never was one. */
export function backupAge(at: string | null, today: IsoDate): number | null {
  const time = at === null ? NaN : Date.parse(at);
  return Number.isNaN(time) ? null : diffDays(today, todayIso(new Date(time)));
}

export function useLastBackup(): string | null {
  const [at, setAt] = useState(lastBackupAt);
  useEffect(() => {
    const update = () => {
      setAt(lastBackupAt());
    };
    addEventListener(EVENT, update);
    return () => {
      removeEventListener(EVENT, update);
    };
  }, []);
  return at;
}
