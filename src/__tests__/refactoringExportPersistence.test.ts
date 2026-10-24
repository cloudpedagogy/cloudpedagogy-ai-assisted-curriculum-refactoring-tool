import { describe, it, expect, beforeEach } from 'vitest';
import { applyRefactoringToDocument } from '../lib/refactoring/applyRefactoring';
import { validateDataset } from '../lib/validation/datasetValidation';
import { saveDataset, loadDataset, clearDataset } from '../lib/storage/localStorage';
import { buildDecisionRecord, exportDecisionRecordAsMarkdown } from '../lib/io/exportDecisionRecord';
import { formatDocumentMarkdown } from '../lib/io/exportMarkdown';
import type { CombinedDataset } from '../types';

describe('Refactoring Export, Validation and Persistence Integration', () => {
  beforeEach(() => {
    clearDataset();
    localStorage.clear();
  });

  const createBaselineDataset = (): CombinedDataset => ({
    schemaVersion: 1,
    documents: [
      {
        id: 'doc-base-1',
        title: 'Cloud Foundations',
        version: '1.0',
        author: 'Lead Instructor',
        blocks: [
          { id: 'b1', type: 'heading', content: 'Distributed Systems' },
          { id: 'b2', type: 'paragraph', content: 'Latency is defined as the network round trip time.' }
        ]
      }
    ],
    contentBlocks: [],
    learningOutcomes: [
      { id: 'lo-1', statement: 'Analyze distributed systems bottlenecks.', level: 'analysis' }
    ],
    suggestions: [
      {
        id: 'sug-clarity-1',
        documentId: 'doc-base-1',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Latency is defined as the network round trip time.',
        suggestedContent: 'Latency is the network round trip time.',
        rationale: 'Active voice clarity improvement',
        status: 'accepted',
        reviewedAt: new Date().toISOString(),
        reviewerNotes: 'Approved for active voice clarity'
      }
    ],
    comparisons: []
  });

  it('generates a refactored document that produces a fully valid CombinedDataset', () => {
    const dataset = createBaselineDataset();
    const sourceDoc = dataset.documents[0];

    const refactorRes = applyRefactoringToDocument(
      sourceDoc,
      dataset.suggestions,
      '1.1-refactored',
      'Curriculum board review sign-off'
    );

    const updatedDataset: CombinedDataset = {
      ...dataset,
      documents: [...dataset.documents, refactorRes.newDocument]
    };

    const valResult = validateDataset(updatedDataset);
    expect(valResult.valid).toBe(true);
    expect(valResult.errors).toHaveLength(0);
    expect(updatedDataset.documents).toHaveLength(2);
    expect(updatedDataset.documents[0].id).toBe('doc-base-1');
    expect(updatedDataset.documents[1].id).toBe('doc-base-1-1.1-refactored');
  });

  it('persists and restores refactored documents from localStorage without data loss', () => {
    const dataset = createBaselineDataset();
    const refactorRes = applyRefactoringToDocument(dataset.documents[0], dataset.suggestions);

    const datasetWithRefactored: CombinedDataset = {
      ...dataset,
      documents: [...dataset.documents, refactorRes.newDocument]
    };

    const saveRes = saveDataset(datasetWithRefactored);
    expect(saveRes.success).toBe(true);

    const loaded = loadDataset();
    expect(loaded).not.toBeNull();
    expect(loaded?.documents).toHaveLength(2);

    const restoredRefactoredDoc = loaded?.documents.find(d => d.id === refactorRes.newDocument.id);
    expect(restoredRefactoredDoc).toBeDefined();
    expect(restoredRefactoredDoc?.version).toBe(refactorRes.newDocument.version);
    expect(restoredRefactoredDoc?.blocks[1].content).toBe('Latency is the network round trip time.');
    expect(restoredRefactoredDoc?.blocks[1].metadata?.refactoredFromSuggestionId).toBe('sug-clarity-1');
  });

  it('generates accurate Human-AI Decision Records linking source and refactored versions', () => {
    const dataset = createBaselineDataset();
    const record = buildDecisionRecord(dataset);

    expect(record.schemaVersion).toBe(1);
    expect(record.metrics.totalSuggestions).toBe(1);
    expect(record.metrics.acceptedCount).toBe(1);
    expect(record.metrics.acceptanceRatePercent).toBe(100);

    expect(record.decisions).toHaveLength(1);
    expect(record.decisions[0].suggestionId).toBe('sug-clarity-1');
    expect(record.decisions[0].documentId).toBe('doc-base-1');
    expect(record.decisions[0].targetBlockId).toBe('b2');
    expect(record.decisions[0].reviewerNotes).toBe('Approved for active voice clarity');

    const md = exportDecisionRecordAsMarkdown(dataset);
    expect(md).toContain('Human–AI Curriculum Decision Record');
    expect(md).toContain('Approved for active voice clarity');
    expect(md).toContain('100%');
  });

  it('exports refactored documents to Markdown with intact section structures', () => {
    const dataset = createBaselineDataset();
    const refactorRes = applyRefactoringToDocument(dataset.documents[0], dataset.suggestions);

    const markdown = formatDocumentMarkdown(refactorRes.newDocument, dataset.learningOutcomes);
    expect(markdown).toContain('# Cloud Foundations (Refactored)');
    expect(markdown).toContain('### Distributed Systems');
    expect(markdown).toContain('Latency is the network round trip time.');
  });
});
