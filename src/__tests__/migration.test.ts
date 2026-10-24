import { describe, it, expect } from 'vitest';
import { migrateDataset, validateDataset } from '../lib/validation/datasetValidation';
import { CURRENT_SCHEMA_VERSION } from '../types';

describe('Schema Migration & Backward Compatibility', () => {
  it('migrates legacy schemaVersion 0 or undefined to CURRENT_SCHEMA_VERSION', () => {
    const legacyRaw = {
      // No schemaVersion field
      documents: [
        {
          id: 'legacy-doc',
          title: 'Legacy Curriculum',
          version: '1.0',
          blocks: [
            { id: 'b1', type: 'paragraph', content: 'Legacy paragraph' }
          ]
        }
      ],
      learningOutcomes: [],
      suggestions: [
        {
          id: 'sug-legacy',
          targetBlockId: 'b1',
          type: 'clarity',
          originalContent: 'Legacy paragraph',
          suggestedContent: 'Refined paragraph',
          rationale: 'Clarity improvement',
          status: 'pending'
          // No documentId
        }
      ]
    };

    const { dataset, migrated } = migrateDataset(legacyRaw);
    expect(migrated).toBe(true);
    expect(dataset.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);

    // Full validation should also backfill the documentId
    const valResult = validateDataset(legacyRaw);
    expect(valResult.valid).toBe(true);
    const sug = valResult.dataset?.suggestions.find(s => s.id === 'sug-legacy');
    expect(sug?.documentId).toBe('legacy-doc');
  });

  it('reports ambiguity when targetBlockId exists in multiple documents and does NOT silently associate an arbitrary document', () => {
    const ambiguousRaw = {
      documents: [
        {
          id: 'doc-alpha',
          title: 'Curriculum Alpha',
          version: '1.0',
          blocks: [{ id: 'shared-block-id', type: 'paragraph', content: 'Content in Alpha' }]
        },
        {
          id: 'doc-beta',
          title: 'Curriculum Beta',
          version: '2.0',
          blocks: [{ id: 'shared-block-id', type: 'paragraph', content: 'Content in Beta' }]
        }
      ],
      suggestions: [
        {
          id: 'sug-ambiguous',
          targetBlockId: 'shared-block-id',
          type: 'update',
          originalContent: 'Content in Alpha',
          suggestedContent: 'Updated content',
          rationale: 'Reason for change',
          status: 'pending'
          // No documentId provided
        }
      ]
    };

    const result = validateDataset(ambiguousRaw);
    expect(result.valid).toBe(true);
    const sug = result.dataset?.suggestions.find(s => s.id === 'sug-ambiguous');
    // Critical assertion: documentId must NOT be assigned to arbitrary doc-alpha or doc-beta!
    expect(sug?.documentId).toBeUndefined();
    // Critical assertion: ambiguity must be explicitly reported in warnings with matching documents
    const ambiguityWarning = result.warnings.find(w => w.includes('Ambiguous block reference'));
    expect(ambiguityWarning).toBeDefined();
    expect(ambiguityWarning).toContain('doc-alpha');
    expect(ambiguityWarning).toContain('doc-beta');
  });

  it('records a warning when a suggestion targets a non-existent block ID', () => {
    const orphanedRaw = {
      documents: [
        {
          id: 'doc-1',
          title: 'Curriculum',
          version: '1.0',
          blocks: [{ id: 'b1', type: 'heading', content: 'Title' }]
        }
      ],
      suggestions: [
        {
          id: 'sug-orphan',
          targetBlockId: 'non-existent-block-id',
          type: 'update',
          originalContent: 'Text',
          suggestedContent: 'New Text',
          rationale: 'Fix text',
          status: 'pending'
        }
      ]
    };

    const result = validateDataset(orphanedRaw);
    expect(result.valid).toBe(true); // Still valid, but preserves warning
    expect(result.warnings.some(w => w.includes('non-existent-block-id'))).toBe(true);
  });
});
