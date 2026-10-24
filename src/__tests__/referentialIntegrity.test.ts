import { describe, it, expect } from 'vitest';
import { repairAndValidateIntegrity } from '../lib/validation/datasetValidation';
import { demoDataset } from '../data/demo';
import type { CombinedDataset } from '../types';

describe('Referential Integrity & Cross-Reference Tracing', () => {
  it('automatically resolves and binds documentId for legacy suggestions', () => {
    const unmappedDataset: CombinedDataset = {
      ...demoDataset,
      suggestions: [
        {
          id: 'sug-legacy-test',
          targetBlockId: 'v3-b2', // Belongs to doc-v3
          type: 'clarity',
          originalContent: 'Original',
          suggestedContent: 'Suggested',
          rationale: 'Clarify content',
          status: 'pending'
          // documentId omitted intentionally
        }
      ]
    };

    const { dataset, warnings } = repairAndValidateIntegrity(unmappedDataset);
    const resolvedSug = dataset.suggestions.find(s => s.id === 'sug-legacy-test');
    expect(resolvedSug?.documentId).toBe('doc-v3');
    expect(warnings.some(w => w.includes('mapped to document "doc-v3"'))).toBe(true);
  });

  it('detects and flags orphaned comparisons targeting non-existent documents', () => {
    const invalidCompDataset: CombinedDataset = {
      ...demoDataset,
      comparisons: [
        {
          id: 'comp-phantom',
          sourceDocId: 'doc-v1',
          targetDocId: 'doc-phantom-nonexistent',
          similarityScore: 0.5,
          matchedBlockIds: [],
          differences: []
        }
      ]
    };

    const { warnings } = repairAndValidateIntegrity(invalidCompDataset);
    expect(warnings.some(w => w.includes('doc-phantom-nonexistent'))).toBe(true);
  });
});
