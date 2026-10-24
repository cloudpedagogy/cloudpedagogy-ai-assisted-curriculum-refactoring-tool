import { describe, it, expect } from 'vitest';
import { applyRefactoringToDocument } from '../lib/refactoring/applyRefactoring';
import type { ContentDocument, RefactoringSuggestion } from '../types';

describe('Real Curriculum Refactoring & Version Provenance', () => {
  const createSourceDocument = (): ContentDocument => ({
    id: 'doc-course-101',
    title: 'Cloud Pedagogy 101',
    version: '1.0',
    author: 'Academic Team',
    blocks: [
      { id: 'b1', type: 'heading', content: 'Module 1: Principles' },
      { id: 'b2', type: 'paragraph', content: 'Original text for block 2 with passive voice.' },
      { id: 'b3', type: 'paragraph', content: 'Original text for block 3 that has an alignment gap.' },
      { id: 'b4', type: 'paragraph', content: 'Original text for block 4 that is unchanged.' }
    ]
  });

  it('creates a new versioned document while preserving the original document completely untouched', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-1',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.',
        suggestedContent: 'Refined active voice text for block 2.',
        rationale: 'Replaced passive voice with direct statement',
        status: 'accepted'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions, '1.1-refactored', 'Approved clarity update');

    // 1. Verify original document is unchanged
    expect(originalDoc.version).toBe('1.0');
    expect(originalDoc.title).toBe('Cloud Pedagogy 101');
    expect(originalDoc.blocks[1].content).toBe('Original text for block 2 with passive voice.');
    expect(originalDoc.blocks[1].metadata?.refactoredFromSuggestionId).toBeUndefined();

    // 2. Verify new document
    expect(result.newDocument.id).toBe('doc-course-101-1.1-refactored');
    expect(result.newDocument.version).toBe('1.1-refactored');
    expect(result.newDocument.title).toBe('Cloud Pedagogy 101 (Refactored)');
    expect(result.appliedCount).toBe(1);
    expect(result.unaffectedCount).toBe(3);

    // 3. Verify applied content on target block
    const updatedBlock = result.newDocument.blocks.find(b => b.id === 'b2');
    expect(updatedBlock?.content).toBe('Refined active voice text for block 2.');
    expect(updatedBlock?.metadata?.refactoredFromSuggestionId).toBe('sug-1');
    expect(updatedBlock?.metadata?.originalContent).toBe('Original text for block 2 with passive voice.');
    expect(updatedBlock?.metadata?.reviewerRationale).toBe('Approved clarity update');

    // 4. Verify untouched blocks in new document
    const untouchedBlock = result.newDocument.blocks.find(b => b.id === 'b4');
    expect(untouchedBlock?.content).toBe('Original text for block 4 that is unchanged.');
    expect(untouchedBlock?.metadata?.refactoredFromSuggestionId).toBeUndefined();
  });

  it('applies educator-modified content when suggestion status is modified', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-2',
        documentId: 'doc-course-101',
        targetBlockId: 'b3',
        type: 'gap',
        originalContent: 'Original text for block 3 that has an alignment gap.',
        suggestedContent: 'Auto-suggested alignment text.',
        modifiedContent: 'Custom academic educator text specifically aligning with Outcome 1.',
        rationale: 'Aligning with Outcome 1',
        status: 'modified',
        reviewerNotes: 'Tailored for UK higher education standards'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    const updatedBlock = result.newDocument.blocks.find(b => b.id === 'b3');
    expect(updatedBlock?.content).toBe('Custom academic educator text specifically aligning with Outcome 1.');
    expect(updatedBlock?.metadata?.reviewerRationale).toBe('Tailored for UK higher education standards');
  });

  it('strictly NEVER applies unreviewed (pending) or rejected suggestions', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-pending',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.',
        suggestedContent: 'Unreviewed change that must NOT be applied.',
        rationale: 'Clarity rule',
        status: 'pending'
      },
      {
        id: 'sug-rejected',
        documentId: 'doc-course-101',
        targetBlockId: 'b3',
        type: 'gap',
        originalContent: 'Original text for block 3 that has an alignment gap.',
        suggestedContent: 'Rejected change that must NOT be applied.',
        rationale: 'Outcome gap rule',
        status: 'rejected'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    expect(result.appliedCount).toBe(0);
    expect(result.unaffectedCount).toBe(4);
    expect(result.appliedSuggestionIds).toHaveLength(0);

    // Document contents match original
    expect(result.newDocument.blocks[1].content).toBe('Original text for block 2 with passive voice.');
    expect(result.newDocument.blocks[2].content).toBe('Original text for block 3 that has an alignment gap.');
  });

  it('ignores suggestions targeting different documents', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-diff-doc',
        documentId: 'other-doc-999',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Some other doc content',
        suggestedContent: 'Change for other doc',
        rationale: 'Other doc rationale',
        status: 'accepted'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);
    expect(result.appliedCount).toBe(0);
    expect(result.newDocument.blocks[1].content).toBe('Original text for block 2 with passive voice.');
  });

  it('resolves conflicting suggestions targeting the same block ID with explicit warnings', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-first',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.',
        suggestedContent: 'First suggestion content',
        rationale: 'First rationale',
        status: 'accepted'
      },
      {
        id: 'sug-second',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.',
        suggestedContent: 'Second override suggestion content',
        rationale: 'Second rationale',
        status: 'accepted'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Conflicting suggestions targeting block "b2"');
    // The later actionable suggestion is safely applied
    const block = result.newDocument.blocks.find(b => b.id === 'b2');
    expect(block?.content).toBe('Second override suggestion content');
  });

  it('blocks application when target block content has drifted (stale source protection)', () => {
    const originalDoc = createSourceDocument();
    // Suppose block b2 was edited in the document after the suggestion was generated
    originalDoc.blocks[1].content = 'Manually updated text for block 2 written by faculty.';

    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-stale',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.', // Stale baseline!
        suggestedContent: 'Refined active voice text for block 2.',
        rationale: 'Active voice clarity improvement',
        status: 'accepted'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    // Must block application
    expect(result.appliedCount).toBe(0);
    expect(result.blockedSuggestionIds).toContain('sug-stale');
    expect(result.warnings.some(w => w.includes('Stale source detected for block "b2"'))).toBe(true);

    // Must preserve the manually updated text in the new document untouched
    const block = result.newDocument.blocks.find(b => b.id === 'b2');
    expect(block?.content).toBe('Manually updated text for block 2 written by faculty.');
    expect(block?.metadata?.refactoredFromSuggestionId).toBeUndefined();
  });

  it('blocks application when suggestion is flagged as outdated', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-outdated',
        documentId: 'doc-course-101',
        targetBlockId: 'b2',
        type: 'clarity',
        originalContent: 'Original text for block 2 with passive voice.',
        suggestedContent: 'Refined active voice text for block 2.',
        rationale: 'Active voice clarity improvement',
        status: 'accepted',
        isOutdated: true,
        outdatedReason: 'Underlying block content has changed since this review was recorded.'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    expect(result.appliedCount).toBe(0);
    expect(result.blockedSuggestionIds).toContain('sug-outdated');
    expect(result.warnings.some(w => w.includes('Application blocked: Suggestion "sug-outdated"'))).toBe(true);
    expect(result.newDocument.blocks[1].content).toBe('Original text for block 2 with passive voice.');
  });

  it('blocks application when suggestion targets a non-existent block ID', () => {
    const originalDoc = createSourceDocument();
    const suggestions: RefactoringSuggestion[] = [
      {
        id: 'sug-ghost-block',
        documentId: 'doc-course-101',
        targetBlockId: 'b-non-existent-999',
        type: 'clarity',
        originalContent: 'Some ghost text',
        suggestedContent: 'Some ghost revision',
        rationale: 'Ghost rationale',
        status: 'accepted'
      }
    ];

    const result = applyRefactoringToDocument(originalDoc, suggestions);

    expect(result.appliedCount).toBe(0);
    expect(result.blockedSuggestionIds).toContain('sug-ghost-block');
    expect(result.warnings.some(w => w.includes('Target block "b-non-existent-999" not found'))).toBe(true);
  });
});
