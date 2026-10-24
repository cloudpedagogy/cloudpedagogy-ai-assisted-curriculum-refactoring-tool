import { describe, it, expect } from 'vitest';
import { validateDataset, synchronizeDatasetBlocks } from '../lib/validation/datasetValidation';
import { demoDataset } from '../data/demo';

describe('Dataset Validation & Referential Integrity', () => {
  it('validates the standard demo dataset successfully', () => {
    const result = validateDataset(demoDataset);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.dataset).toBeDefined();
    expect(result.dataset?.documents).toHaveLength(3);
    expect(result.dataset?.contentBlocks).toHaveLength(9);
  });

  it('rejects non-object or null input data', () => {
    expect(validateDataset(null).valid).toBe(false);
    expect(validateDataset('string').valid).toBe(false);
    expect(validateDataset(123).valid).toBe(false);
    expect(validateDataset(undefined).valid).toBe(false);
  });

  it('rejects datasets missing documents array', () => {
    const result = validateDataset({
      schemaVersion: 1,
      suggestions: []
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('documents'))).toBe(true);
  });

  it('rejects documents with missing required properties', () => {
    const result = validateDataset({
      documents: [
        { id: '', title: 'Missing Id', version: '1.0', blocks: [] }
      ]
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing a valid string "id"'))).toBe(true);
  });

  it('rejects content blocks with invalid types', () => {
    const result = validateDataset({
      documents: [
        {
          id: 'doc-1',
          title: 'Test Doc',
          version: '1.0',
          blocks: [
            { id: 'b-1', type: 'unsupported-type', content: 'Some text' }
          ]
        }
      ]
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid type'))).toBe(true);
  });

  it('validates learning outcomes and flags invalid Bloom levels', () => {
    const result = validateDataset({
      documents: [
        { id: 'doc-1', title: 'Doc', version: '1.0', blocks: [] }
      ],
      learningOutcomes: [
        { id: 'lo-1', statement: 'Valid outcome', level: 'analysis' },
        { id: 'lo-2', statement: 'Invalid level', level: 'invalid-level' }
      ]
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Bloom\'s level'))).toBe(true);
  });

  it('synchronizes contentBlocks as a direct projection of document blocks', () => {
    const modifiedDataset = {
      ...demoDataset,
      documents: [
        {
          id: 'doc-new',
          title: 'New Doc',
          version: '1.0',
          blocks: [
            { id: 'nb-1', type: 'paragraph' as const, content: 'Block 1' },
            { id: 'nb-2', type: 'heading' as const, content: 'Block 2' }
          ]
        }
      ],
      contentBlocks: [] // Stale or empty
    };

    const synced = synchronizeDatasetBlocks(modifiedDataset);
    expect(synced.contentBlocks).toHaveLength(2);
    expect(synced.contentBlocks[0].id).toBe('nb-1');
    expect(synced.contentBlocks[1].id).toBe('nb-2');
  });
});
