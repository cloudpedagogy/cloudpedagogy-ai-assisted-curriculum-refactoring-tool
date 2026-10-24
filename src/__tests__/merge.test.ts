import { describe, it, expect } from 'vitest';
import { mergeDatasets } from '../lib/validation/datasetValidation';
import { demoDataset } from '../data/demo';
import type { CombinedDataset } from '../types';

describe('Dataset Merge & Collision Prevention', () => {
  it('skips duplicate documents when content is identical', () => {
    const incoming: CombinedDataset = {
      ...demoDataset,
      documents: [demoDataset.documents[0]] // identical to doc-v1
    };

    const result = mergeDatasets(demoDataset, incoming);
    expect(result.stats.documentsSkipped).toBe(1);
    expect(result.dataset.documents).toHaveLength(demoDataset.documents.length);
  });

  it('prevents silent overwriting when incoming document has colliding ID but differing content', () => {
    const incoming: CombinedDataset = {
      schemaVersion: 1,
      documents: [
        {
          id: 'doc-v1', // Collides with existing doc-v1!
          title: 'Different Title For v1',
          version: '2099',
          blocks: [
            { id: 'diff-b1', type: 'paragraph', content: 'Completely different content' }
          ]
        }
      ],
      contentBlocks: [],
      learningOutcomes: [],
      suggestions: [],
      comparisons: []
    };

    const result = mergeDatasets(demoDataset, incoming);
    expect(result.stats.documentsRenamed).toBe(1);
    expect(result.dataset.documents).toHaveLength(demoDataset.documents.length + 1);

    // Existing doc-v1 is intact
    const originalDoc = result.dataset.documents.find(d => d.id === 'doc-v1');
    expect(originalDoc?.title).toBe('Epidemiology (Legacy Version)');

    // Imported doc was assigned a unique ID
    const importedDoc = result.dataset.documents.find(d => d.title.includes('Different Title'));
    expect(importedDoc).toBeDefined();
    expect(importedDoc?.id).not.toBe('doc-v1');
    expect(result.warnings.some(w => w.includes('Document ID collision'))).toBe(true);
  });

  it('remaps colliding block IDs and updates associated suggestions to prevent cross-document confusion', () => {
    const incoming: CombinedDataset = {
      schemaVersion: 1,
      documents: [
        {
          id: 'doc-external',
          title: 'External Course',
          version: '1.0',
          blocks: [
            // Collides with existing 'v1-b1' in doc-v1!
            { id: 'v1-b1', type: 'paragraph', content: 'Colliding block content in external course' }
          ]
        }
      ],
      contentBlocks: [],
      learningOutcomes: [],
      suggestions: [
        {
          id: 'sug-ext-1',
          documentId: 'doc-external',
          targetBlockId: 'v1-b1', // Targets the incoming block
          type: 'clarity',
          originalContent: 'Colliding block content',
          suggestedContent: 'Refined external content',
          rationale: 'Improve phrasing',
          status: 'pending'
        }
      ],
      comparisons: []
    };

    const result = mergeDatasets(demoDataset, incoming);
    expect(result.stats.blocksRemapped).toBe(1);

    const mergedExternalDoc = result.dataset.documents.find(d => d.id === 'doc-external');
    expect(mergedExternalDoc).toBeDefined();
    const remappedBlock = mergedExternalDoc?.blocks[0];
    expect(remappedBlock?.id).not.toBe('v1-b1'); // Remapped to unique ID!
    expect(remappedBlock?.id).toBe('doc-external_v1-b1');

    // Crucial: The incoming suggestion must now point to the remapped block ID!
    const updatedSug = result.dataset.suggestions.find(s => s.id === 'sug-ext-1');
    expect(updatedSug?.targetBlockId).toBe('doc-external_v1-b1');
    expect(updatedSug?.documentId).toBe('doc-external');

    // And existing v1-b1 in doc-v1 remains untouched!
    const originalDoc = result.dataset.documents.find(d => d.id === 'doc-v1');
    expect(originalDoc?.blocks[0].id).toBe('v1-b1');
  });

  it('renames colliding learning outcomes and suggestions without silent data loss', () => {
    const incoming: CombinedDataset = {
      schemaVersion: 1,
      documents: [],
      contentBlocks: [],
      learningOutcomes: [
        {
          id: 'lo-1', // Collides with existing lo-1
          statement: 'A different statement for lo-1',
          level: 'evaluation'
        }
      ],
      suggestions: [
        {
          id: 'sug-1', // Collides with existing sug-1
          targetBlockId: 'v1-b2',
          type: 'clarity',
          originalContent: 'Original',
          suggestedContent: 'Suggested',
          rationale: 'Rationale',
          status: 'pending'
        }
      ],
      comparisons: []
    };

    const result = mergeDatasets(demoDataset, incoming);
    expect(result.stats.outcomesRenamed).toBe(1);
    expect(result.stats.suggestionsRenamed).toBe(1);

    // Both original lo-1 and renamed imported outcome exist
    expect(result.dataset.learningOutcomes).toHaveLength(demoDataset.learningOutcomes.length + 1);
    // Both original sug-1 and renamed imported suggestion exist
    expect(result.dataset.suggestions).toHaveLength(demoDataset.suggestions.length + 1);
  });
});
