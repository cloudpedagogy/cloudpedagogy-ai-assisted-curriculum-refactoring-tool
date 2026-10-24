import {
  CURRENT_SCHEMA_VERSION,
  type CombinedDataset,
  type ContentDocument
} from '../../types';
import { validateDataset } from '../validation/datasetValidation';

export interface ImportResult {
  success: boolean;
  dataset?: CombinedDataset;
  error?: string;
  warnings: string[];
}

/**
 * Parses and validates an imported JSON string into a validated CombinedDataset.
 * Gracefully accommodates full CombinedDataset JSON, array of documents, or a single document.
 */
export function parseAndValidateImport(jsonString: string): ImportResult {
  const warnings: string[] = [];

  if (!jsonString || !jsonString.trim()) {
    return {
      success: false,
      error: 'Import payload is empty. Please select a JSON file or paste curriculum data.',
      warnings: []
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `JSON syntax error: ${msg}`,
      warnings: []
    };
  }

  // Case 1: Array of ContentDocument
  if (Array.isArray(parsed)) {
    warnings.push('Detected document array format; constructing full dataset container.');
    const wrappedDataset: CombinedDataset = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      documents: parsed as ContentDocument[],
      contentBlocks: [],
      learningOutcomes: [],
      suggestions: [],
      comparisons: []
    };
    const val = validateDataset(wrappedDataset);
    if (!val.valid || !val.dataset) {
      return {
        success: false,
        error: `Invalid document array: ${val.errors.join('; ')}`,
        warnings: [...warnings, ...val.warnings]
      };
    }
    return {
      success: true,
      dataset: val.dataset,
      warnings: [...warnings, ...val.warnings]
    };
  }

  // Case 2: Single ContentDocument object with title & blocks
  if (parsed && typeof parsed === 'object' && !('documents' in parsed) && 'title' in parsed && 'blocks' in parsed) {
    warnings.push('Detected single document format; wrapping in standard dataset.');
    const singleDoc = parsed as ContentDocument;
    const wrappedDataset: CombinedDataset = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      documents: [singleDoc],
      contentBlocks: [],
      learningOutcomes: [],
      suggestions: [],
      comparisons: []
    };
    const val = validateDataset(wrappedDataset);
    if (!val.valid || !val.dataset) {
      return {
        success: false,
        error: `Invalid document structure: ${val.errors.join('; ')}`,
        warnings: [...warnings, ...val.warnings]
      };
    }
    return {
      success: true,
      dataset: val.dataset,
      warnings: [...warnings, ...val.warnings]
    };
  }

  // Case 3: Full CombinedDataset format
  const validation = validateDataset(parsed);
  if (!validation.valid || !validation.dataset) {
    return {
      success: false,
      error: `Dataset validation failed:\n• ${validation.errors.join('\n• ')}`,
      warnings: validation.warnings
    };
  }

  return {
    success: true,
    dataset: validation.dataset,
    warnings: validation.warnings
  };
}
