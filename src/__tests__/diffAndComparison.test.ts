import { describe, it, expect } from 'vitest';
import { calculateTokenJaccard } from '../lib/analysis/tokenization';
import { compareDocuments, buildAlignedComparisonRows } from '../lib/processing/comparison';
import { computeWordDiff } from '../lib/processing/diff';
import type { ContentDocument } from '../types';

describe('Diff and Comparison Engine', () => {
  describe('Bounded Token Jaccard Similarity', () => {
    it('returns 1.0 for identical content', () => {
      const score = calculateTokenJaccard(
        'Cloud architecture requires resilient design patterns.',
        'Cloud architecture requires resilient design patterns.'
      );
      expect(score).toBe(1.0);
    });

    it('returns 1.0 when both texts are empty', () => {
      expect(calculateTokenJaccard('', '')).toBe(1.0);
      expect(calculateTokenJaccard('   ', '')).toBe(1.0);
    });

    it('returns 0.0 when one text is empty and the other is not', () => {
      expect(calculateTokenJaccard('Distributed cloud networks', '')).toBe(0.0);
      expect(calculateTokenJaccard('', 'Distributed cloud networks')).toBe(0.0);
    });

    it('never exceeds 1.0 due to repeated tokens (mathematically bounded)', () => {
      // Legacy code had a flaw where repeated tokens in one string could inflate the numerator
      const score = calculateTokenJaccard('cloud cloud cloud cloud', 'cloud');
      expect(score).toBe(1.0);
      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeGreaterThanOrEqual(0.0);
    });

    it('preserves short domain terms like plan, risk, data', () => {
      const score = calculateTokenJaccard('data risk plan', 'data risk plan');
      expect(score).toBe(1.0);
    });
  });

  describe('Word-Level Diffing (LCS)', () => {
    it('returns unchanged chunk for identical text', () => {
      const diff = computeWordDiff('Identical text content', 'Identical text content');
      expect(diff).toEqual([{ type: 'unchanged', text: 'Identical text content' }]);
    });

    it('detects added words correctly', () => {
      const diff = computeWordDiff('Cloud systems', 'Cloud distributed systems');
      const added = diff.find(d => d.type === 'added');
      expect(added).toBeDefined();
      expect(added?.text).toContain('distributed');
    });

    it('detects removed words correctly', () => {
      const diff = computeWordDiff('Legacy physical monolithic servers', 'Legacy servers');
      const removed = diff.find(d => d.type === 'removed');
      expect(removed).toBeDefined();
      expect(removed?.text).toContain('physical monolithic');
    });

    it('handles empty original or revised text safely', () => {
      const addedAll = computeWordDiff('', 'New content');
      expect(addedAll).toEqual([{ type: 'added', text: 'New content' }]);

      const removedAll = computeWordDiff('Deleted content', '');
      expect(removedAll).toEqual([{ type: 'removed', text: 'Deleted content' }]);
    });
  });

  describe('Document Comparison & Aligned Rows', () => {
    const doc1: ContentDocument = {
      id: 'doc-v1',
      title: 'Module Overview',
      version: '1.0',
      blocks: [
        { id: 'b1', type: 'heading', content: 'Introduction' },
        { id: 'b2', type: 'paragraph', content: 'Cloud infrastructure scales horizontally.' },
        { id: 'b3', type: 'paragraph', content: 'Legacy on-premise hardware requires routine maintenance.' }
      ]
    };

    const doc2: ContentDocument = {
      id: 'doc-v2',
      title: 'Module Overview',
      version: '2.0',
      blocks: [
        { id: 'b1', type: 'heading', content: 'Introduction' },
        { id: 'b2', type: 'paragraph', content: 'Cloud infrastructure scales dynamically and horizontally.' },
        { id: 'b4', type: 'paragraph', content: 'Modern serverless functions execute on event triggers.' }
      ]
    };

    it('identifies matched, modified, removed, and added blocks across versions', () => {
      const result = compareDocuments(doc1, doc2);

      expect(result.sourceDocId).toBe('doc-v1');
      expect(result.targetDocId).toBe('doc-v2');

      // Matched heading b1
      expect(result.matchedBlockIds.some(m => m[0] === 'b1' && m[1] === 'b1')).toBe(true);

      // Modified paragraph b2
      const modDiff = result.differences.find(d => d.sourceBlockId === 'b2');
      expect(modDiff?.type).toBe('modified');

      // Removed b3
      const remDiff = result.differences.find(d => d.sourceBlockId === 'b3');
      expect(remDiff?.type).toBe('removed');

      // Added b4
      const addDiff = result.differences.find(d => d.targetBlockId === 'b4');
      expect(addDiff?.type).toBe('added');

      expect(result.similarityScore).toBeGreaterThan(0);
      expect(result.similarityScore).toBeLessThanOrEqual(1.0);
    });

    it('handles comparison between empty documents without producing NaN', () => {
      const emptyDocA: ContentDocument = { id: 'empty-a', title: 'Empty A', version: '1.0', blocks: [] };
      const emptyDocB: ContentDocument = { id: 'empty-b', title: 'Empty B', version: '2.0', blocks: [] };

      const comp = compareDocuments(emptyDocA, emptyDocB);
      expect(Number.isNaN(comp.similarityScore)).toBe(false);
      expect(comp.similarityScore).toBe(1.0);

      const compOneEmpty = compareDocuments(doc1, emptyDocB);
      expect(Number.isNaN(compOneEmpty.similarityScore)).toBe(false);
      expect(compOneEmpty.similarityScore).toBe(0.0);
    });

    it('builds aligned side-by-side rows with placeholders for missing content', () => {
      const result = compareDocuments(doc1, doc2);
      const rows = buildAlignedComparisonRows(doc1, doc2, result);

      expect(rows.length).toBeGreaterThanOrEqual(3);

      // Check for removed row (has sourceBlock, no targetBlock)
      const removedRow = rows.find(r => r.status === 'removed');
      expect(removedRow).toBeDefined();
      expect(removedRow?.sourceBlock?.id).toBe('b3');
      expect(removedRow?.targetBlock).toBeUndefined();

      // Check for added row (has targetBlock, no sourceBlock)
      const addedRow = rows.find(r => r.status === 'added');
      expect(addedRow).toBeDefined();
      expect(addedRow?.targetBlock?.id).toBe('b4');
      expect(addedRow?.sourceBlock).toBeUndefined();

      // Check for modified row
      const modRow = rows.find(r => r.status === 'modified');
      expect(modRow).toBeDefined();
      expect(modRow?.sourceBlock?.id).toBe('b2');
      expect(modRow?.targetBlock?.id).toBe('b2');
    });
  });
});
