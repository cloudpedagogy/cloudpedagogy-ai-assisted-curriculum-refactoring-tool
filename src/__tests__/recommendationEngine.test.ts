import { describe, it, expect } from 'vitest';
import {
  generateRecommendations,
  generateAllRecommendations,
  reconcileSuggestions
} from '../lib/analysis/recommendationEngine';
import type { CombinedDataset, RefactoringSuggestion } from '../types';

describe('Deterministic Heuristic Recommendation Engine', () => {
  const createMockDataset = (): CombinedDataset => ({
    schemaVersion: 1,
    documents: [
      {
        id: 'doc-1',
        title: 'Cloud Foundations',
        version: '1.0',
        blocks: [
          {
            id: 'b-title',
            type: 'heading',
            content: 'Introduction to Cloud Architectures'
          },
          {
            id: 'b-passive',
            type: 'paragraph',
            content: 'In this section, latency is defined as the total round-trip time experienced by a packet across the network.'
          },
          {
            id: 'b-runon',
            type: 'paragraph',
            content: 'Cloud computing provides distributed resources across global datacenters where virtual machines containers storage buckets serverless functions databases message queues and API gateways are orchestrated dynamically to meet fluctuating user demands without requiring manual physical hardware provisioning by engineers.'
          },
          {
            id: 'b-unaligned',
            type: 'paragraph',
            content: 'Cooking recipes require flour eggs and milk blended smoothly at room temperature.'
          }
        ]
      },
      {
        id: 'doc-2',
        title: 'Advanced Cloud',
        version: '2.0',
        blocks: [
          {
            id: 'b-dup',
            type: 'paragraph',
            content: 'In this section, latency is defined as the total round-trip time experienced by a packet across the network.'
          }
        ]
      }
    ],
    contentBlocks: [],
    learningOutcomes: [
      {
        id: 'lo-1',
        statement: 'Analyze network latency and cloud throughput bottlenecks.',
        level: 'analysis'
      }
    ],
    suggestions: [],
    comparisons: []
  });

  it('generates reproducible, deterministic suggestion IDs and content', () => {
    const dataset = createMockDataset();
    const doc1 = dataset.documents[0];

    const run1 = generateRecommendations(doc1, dataset);
    const run2 = generateRecommendations(doc1, dataset);

    expect(run1.length).toBeGreaterThan(0);
    expect(run1.length).toBe(run2.length);

    // Strict equality of IDs and contents across runs
    run1.forEach((sug, i) => {
      expect(sug.id).toBe(run2[i].id);
      expect(sug.type).toBe(run2[i].type);
      expect(sug.targetBlockId).toBe(run2[i].targetBlockId);
      expect(sug.documentId).toBe('doc-1');
      expect(sug.suggestedContent).toBe(run2[i].suggestedContent);
      expect(sug.status).toBe('pending');
    });
  });

  it('detects passive voice and provides concise active voice alternatives', () => {
    const dataset = createMockDataset();
    const doc1 = dataset.documents[0];

    const suggestions = generateRecommendations(doc1, dataset);
    const passiveSug = suggestions.find(s => s.targetBlockId === 'b-passive' && s.type === 'clarity');

    expect(passiveSug).toBeDefined();
    expect(passiveSug?.rationale).toContain('Heuristic Clarity Recommendation');
    expect(passiveSug?.suggestedContent).toContain('is the total round-trip time');
    expect(passiveSug?.suggestedContent).not.toContain('is defined as the');
  });

  it('detects run-on sentences exceeding academic clarity thresholds', () => {
    const dataset = createMockDataset();
    const doc1 = dataset.documents[0];

    const suggestions = generateRecommendations(doc1, dataset);
    const runonSug = suggestions.find(s => s.targetBlockId === 'b-runon' && s.type === 'clarity');

    expect(runonSug).toBeDefined();
    expect(runonSug?.rationale).toContain('Sentence contains');
  });

  it('detects unaligned content blocks against curriculum learning outcomes', () => {
    const dataset = createMockDataset();
    const doc1 = dataset.documents[0];

    const suggestions = generateRecommendations(doc1, dataset);
    const gapSug = suggestions.find(s => s.targetBlockId === 'b-unaligned' && s.type === 'gap');

    expect(gapSug).toBeDefined();
    expect(gapSug?.rationale).toContain('Diagnostic Alignment Review');
    expect(gapSug?.suggestedContent).toBe('Cooking recipes require flour eggs and milk blended smoothly at room temperature.');
    expect(gapSug?.suggestedContent).not.toContain('Focuses on:');
  });

  it('detects cross-document duplicates and generates merge recommendations', () => {
    const dataset = createMockDataset();
    const doc2 = dataset.documents[1];

    const suggestions = generateRecommendations(doc2, dataset);
    const dupSug = suggestions.find(s => s.targetBlockId === 'b-dup' && s.type === 'merge');

    expect(dupSug).toBeDefined();
    expect(dupSug?.rationale).toContain('Heuristic Redundancy Indicator');
    expect(dupSug?.rationale).toContain('Cloud Foundations');
  });

  it('skips generating suggestions if they already exist in the dataset', () => {
    const dataset = createMockDataset();
    const doc1 = dataset.documents[0];

    // First run
    const initialSuggestions = generateRecommendations(doc1, dataset);
    dataset.suggestions = initialSuggestions;

    // Second run with suggestions already present
    const subsequentSuggestions = generateRecommendations(doc1, dataset);
    expect(subsequentSuggestions).toHaveLength(0);
  });

  it('generates suggestions across all documents in a dataset', () => {
    const dataset = createMockDataset();
    const all = generateAllRecommendations(dataset);

    expect(all.length).toBeGreaterThan(0);
    const docIds = new Set(all.map(s => s.documentId));
    expect(docIds.has('doc-1')).toBe(true);
    expect(docIds.has('doc-2')).toBe(true);
  });

  it('reconciles suggestions and flags outdated reviews without discarding decisions or notes', () => {
    const dataset = createMockDataset();
    const reviewedSug: RefactoringSuggestion = {
      id: 'sug-clarity-1',
      documentId: 'doc-1',
      targetBlockId: 'b-passive',
      type: 'clarity',
      originalContent: 'In this section, latency is defined as the total round-trip time experienced by a packet across the network.',
      suggestedContent: 'In this section, latency is the total round-trip time experienced by a packet across the network.',
      rationale: 'Active voice clarity improvement',
      status: 'accepted',
      reviewedAt: '2026-10-24T12:00:00Z',
      reviewerNotes: 'Approved for clarity'
    };

    // Scenario A: content has NOT changed
    const resA = reconcileSuggestions([reviewedSug], dataset.documents);
    expect(resA.outdatedCount).toBe(0);
    expect(resA.reconciled[0].isOutdated).toBeFalsy();
    expect(resA.reconciled[0].status).toBe('accepted');
    expect(resA.reconciled[0].reviewerNotes).toBe('Approved for clarity');

    // Scenario B: underlying block content HAS changed
    const modifiedDoc = {
      ...dataset.documents[0],
      blocks: dataset.documents[0].blocks.map(b =>
        b.id === 'b-passive'
          ? { ...b, content: 'Underlying block was completely rewritten by an educator.' }
          : b
      )
    };

    const resB = reconcileSuggestions([reviewedSug], [modifiedDoc]);
    expect(resB.outdatedCount).toBe(1);
    expect(resB.reconciled[0].isOutdated).toBe(true);
    expect(resB.reconciled[0].outdatedReason).toContain('Underlying block content has changed');
    // Human decision and reviewer notes remain completely intact
    expect(resB.reconciled[0].status).toBe('accepted');
    expect(resB.reconciled[0].reviewerNotes).toBe('Approved for clarity');
    expect(resB.reconciled[0].reviewedAt).toBe('2026-10-24T12:00:00Z');
  });
});
