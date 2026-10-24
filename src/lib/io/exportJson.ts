import { CURRENT_SCHEMA_VERSION, type CombinedDataset } from '../../types';
import { synchronizeDatasetBlocks } from '../validation/datasetValidation';

/**
 * Serializes a CombinedDataset into a validated, formatted JSON string.
 */
export function exportDatasetAsJson(dataset: CombinedDataset): string {
  const synchronized = synchronizeDatasetBlocks(dataset);
  const payload: CombinedDataset = {
    ...synchronized,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Triggers a browser file download for a text string.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
