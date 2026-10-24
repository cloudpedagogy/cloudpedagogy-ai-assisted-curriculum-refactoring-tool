import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveDataset,
  loadDatasetDetailed,
  clearDataset,
  STORAGE_KEY,
  BACKUP_KEY,
  CORRUPTED_KEY
} from '../lib/storage/localStorage';
import { demoDataset } from '../data/demo';

describe('Storage Resilience & Recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and loads a valid dataset with block synchronization', () => {
    const saveResult = saveDataset(demoDataset);
    expect(saveResult.success).toBe(true);

    const loadResult = loadDatasetDetailed();
    expect(loadResult.dataset).toBeDefined();
    expect(loadResult.dataset?.documents).toHaveLength(3);
    expect(loadResult.dataset?.contentBlocks).toHaveLength(9);
  });

  it('creates an automated backup before overwriting previous data', () => {
    saveDataset(demoDataset);
    expect(localStorage.getItem(STORAGE_KEY)).toBeDefined();

    // Modify dataset and save again
    const updated = {
      ...demoDataset,
      aiInvolvement: 'Updated AI involvement statement'
    };
    saveDataset(updated);

    expect(localStorage.getItem(BACKUP_KEY)).toBeDefined();
    const backupJson = JSON.parse(localStorage.getItem(BACKUP_KEY)!);
    expect(backupJson.aiInvolvement).toBeUndefined(); // Earlier state
  });

  it('prevents corrupted or invalid data in primary storage from overwriting a valid recovery backup', () => {
    // 1. Establish valid backup
    saveDataset(demoDataset);
    saveDataset({ ...demoDataset, aiInvolvement: 'State 2' });

    const validBackupBefore = localStorage.getItem(BACKUP_KEY);
    expect(validBackupBefore).not.toBeNull();

    // 2. Corrupt STORAGE_KEY
    localStorage.setItem(STORAGE_KEY, '{ corrupted json syntax');

    // 3. Attempt a new saveDataset call while STORAGE_KEY is corrupted
    const saveResult = saveDataset(demoDataset);
    expect(saveResult.success).toBe(true);

    // 4. Verify that BACKUP_KEY was NOT overwritten with the corrupted string!
    const backupAfter = localStorage.getItem(BACKUP_KEY);
    expect(backupAfter).toBe(validBackupBefore);
    expect(backupAfter).not.toBe('{ corrupted json syntax');
    expect(JSON.parse(backupAfter!).documents).toBeDefined();
  });

  it('recovers from backup if primary storage is corrupted with invalid JSON syntax', () => {
    // 1. Save valid initial state to establish backup
    saveDataset(demoDataset);
    saveDataset({ ...demoDataset, aiInvolvement: 'State 2' });

    // 2. Corrupt primary key with malformed JSON
    localStorage.setItem(STORAGE_KEY, '{ invalid JSON syntax');

    // 3. Load should detect corruption, save raw to diagnostic key, and recover from backup
    const loadResult = loadDatasetDetailed();
    expect(loadResult.recoveredFromBackup).toBe(true);
    expect(loadResult.dataset).toBeDefined();
    expect(localStorage.getItem(CORRUPTED_KEY)).toBe('{ invalid JSON syntax');
  });

  it('returns informative error without deleting data when no backup exists', () => {
    localStorage.setItem(STORAGE_KEY, '{ completely invalid json');

    const loadResult = loadDatasetDetailed();
    expect(loadResult.dataset).toBeNull();
    expect(loadResult.error).toContain('invalid JSON syntax');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{ completely invalid json'); // Not deleted!
  });

  it('reports failure when localStorage quota is exceeded and does not falsely report success', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      const quotaErr = new Error('The quota has been exceeded.');
      quotaErr.name = 'QuotaExceededError';
      throw quotaErr;
    });

    const result = saveDataset(demoDataset);
    expect(result.success).toBe(false);
    expect(result.error).toContain('quota exceeded');
    spy.mockRestore();
  });

  it('clearDataset removes primary key but retains backup for recovery safety', () => {
    saveDataset(demoDataset);
    clearDataset();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(BACKUP_KEY)).toBeDefined();
  });
});
