import type { CombinedDataset } from '../../types';
import { validateDataset, synchronizeDatasetBlocks } from '../validation/datasetValidation';

export const STORAGE_KEY = 'curriculum_refactoring_tool_data';
export const BACKUP_KEY = 'curriculum_refactoring_tool_data_backup';
export const CORRUPTED_KEY = 'curriculum_refactoring_tool_corrupted_raw';

export interface StorageLoadResult {
  dataset: CombinedDataset | null;
  error?: string;
  migrated?: boolean;
  warnings?: string[];
  recoveredFromBackup?: boolean;
}

export interface StorageSaveResult {
  success: boolean;
  error?: string;
}

/**
 * Saves a dataset to localStorage with automatic block synchronization and backup.
 */
export const saveDataset = (dataset: CombinedDataset): StorageSaveResult => {
  try {
    const synchronized = synchronizeDatasetBlocks(dataset);
    const serialized = JSON.stringify(synchronized);

    // Attempt to maintain previous valid state as backup before overwriting.
    // Ensure invalid or corrupted data in STORAGE_KEY cannot overwrite a valid BACKUP_KEY.
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous) {
      let isPreviousValid = false;
      try {
        const parsed = JSON.parse(previous);
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).documents)) {
          isPreviousValid = true;
        }
      } catch {
        isPreviousValid = false;
      }

      if (isPreviousValid) {
        try {
          localStorage.setItem(BACKUP_KEY, previous);
        } catch {
          // Non-fatal if backup cannot be stored
        }
      } else {
        // Corrupted or invalid content in STORAGE_KEY is captured in diagnostic key, leaving valid BACKUP_KEY untouched
        try {
          if (!localStorage.getItem(CORRUPTED_KEY)) {
            localStorage.setItem(CORRUPTED_KEY, previous);
          }
        } catch {
          // Non-fatal
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to save dataset to localStorage:', message);
    const isQuota = message.toLowerCase().includes('quota');
    return {
      success: false,
      error: isQuota
        ? 'Browser storage quota exceeded. Unable to persist curriculum.'
        : `Storage error: ${message}`
    };
  }
};

/**
 * Loads and validates dataset from localStorage, automatically applying migrations.
 * Never silently deletes valid existing user data if corruption is detected.
 */
export const loadDatasetDetailed = (): StorageLoadResult => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return { dataset: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch (parseErr) {
      console.error('Failed to parse localStorage JSON:', parseErr);
      // Preserve corrupted string in a dedicated diagnostic key
      try {
        localStorage.setItem(CORRUPTED_KEY, serialized);
      } catch {
        // ignore
      }

      // Check if backup is available
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        try {
          const backupParsed = JSON.parse(backup);
          const valBackup = validateDataset(backupParsed);
          if (valBackup.valid && valBackup.dataset) {
            return {
              dataset: valBackup.dataset,
              recoveredFromBackup: true,
              warnings: ['Primary storage was corrupted; successfully recovered from automated backup.']
            };
          }
        } catch {
          // ignore backup failure
        }
      }

      return {
        dataset: null,
        error: 'Stored curriculum data contains invalid JSON syntax. Original content preserved in diagnostic backup.'
      };
    }

    const validation = validateDataset(parsed);
    if (!validation.valid || !validation.dataset) {
      return {
        dataset: null,
        error: `Stored curriculum data failed schema validation: ${validation.errors.join('; ')}`,
        warnings: validation.warnings
      };
    }

    // If migrated, automatically persist the updated schema
    const wasMigrated = validation.warnings.some(w => w.includes('migrated'));
    if (wasMigrated) {
      saveDataset(validation.dataset);
    }

    return {
      dataset: validation.dataset,
      migrated: wasMigrated,
      warnings: validation.warnings
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to load dataset from localStorage:', message);
    return {
      dataset: null,
      error: `Unexpected error reading from storage: ${message}`
    };
  }
};

/**
 * Convenience getter returning just the dataset or null for basic consumers.
 */
export const loadDataset = (): CombinedDataset | null => {
  const result = loadDatasetDetailed();
  return result.dataset;
};

/**
 * Clears current dataset while preserving backup for safety.
 */
export const clearDataset = (): void => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).documents)) {
          localStorage.setItem(BACKUP_KEY, existing);
        }
      } catch {
        // Do not overwrite backup with malformed existing data
      }
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
};
