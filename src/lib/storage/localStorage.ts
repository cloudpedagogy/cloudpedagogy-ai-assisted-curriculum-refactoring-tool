import type { CombinedDataset } from '../../types';

const STORAGE_KEY = 'curriculum_refactoring_tool_data';

export const saveDataset = (dataset: CombinedDataset): void => {
  try {
    const serialized = JSON.stringify(dataset);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save dataset to localStorage:', err);
  }
};

export const loadDataset = (): CombinedDataset | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (err) {
    console.error('Failed to load dataset from localStorage:', err);
    return null;
  }
};

export const clearDataset = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
