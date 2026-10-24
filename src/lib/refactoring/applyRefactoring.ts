import type { ContentDocument, RefactoringSuggestion, ContentBlock } from '../../types';

export interface ApplyRefactoringResult {
  newDocument: ContentDocument;
  appliedCount: number;
  unaffectedCount: number;
  warnings: string[];
  appliedSuggestionIds: string[];
  blockedSuggestionIds: string[];
  reviewerRationale?: string;
}

/**
 * Creates a new, versioned curriculum document by applying accepted and modified suggestions
 * to an existing document while preserving the original document completely untouched.
 *
 * Enforces strict governance and safety safeguards:
 * - Unreviewed ('pending') suggestions are strictly NEVER applied.
 * - 'rejected' suggestions are discarded.
 * - Stale source protection: If the current target block content does not match the suggestion's
 *   baseline originalContent, application is BLOCKED to prevent overwriting modified text.
 * - Outdated review protection: Suggestions flagged as isOutdated are BLOCKED until explicitly re-evaluated.
 * - Cross-document protection: Suggestions targeting other documents or non-existent blocks are BLOCKED.
 * - Multiple conflicting suggestions targeting the same block ID are resolved safely with explicit warnings.
 */
export function applyRefactoringToDocument(
  sourceDoc: ContentDocument,
  suggestions: RefactoringSuggestion[],
  newVersionName?: string,
  reviewerRationale?: string
): ApplyRefactoringResult {
  const warnings: string[] = [];
  const appliedSuggestionIds: string[] = [];
  const blockedSuggestionIds: string[] = [];

  // Filter suggestions relevant to this document
  const applicableSuggestions = suggestions.filter(s => {
    if (s.documentId) {
      if (s.documentId !== sourceDoc.id) {
        return false;
      }
      return true;
    }
    return sourceDoc.blocks.some(b => b.id === s.targetBlockId);
  });

  // Check for suggestions targeting non-existent blocks in this document
  suggestions.forEach(s => {
    if (s.status === 'accepted' || s.status === 'modified') {
      if (s.documentId && s.documentId !== sourceDoc.id) {
        // Belongs to another document; safely skipped
        return;
      }
      const blockExists = sourceDoc.blocks.some(b => b.id === s.targetBlockId);
      if (!blockExists) {
        warnings.push(
          `Target block "${s.targetBlockId}" not found in document "${sourceDoc.title}". Suggestion "${s.id}" was blocked.`
        );
        blockedSuggestionIds.push(s.id);
      }
    }
  });

  // Only accepted or modified suggestions can be applied
  const actionableSuggestions = applicableSuggestions.filter(
    s => s.status === 'accepted' || s.status === 'modified'
  );

  // Group by targetBlockId to detect conflicts
  const blockSuggestionMap = new Map<string, RefactoringSuggestion>();
  actionableSuggestions.forEach(sug => {
    if (blockSuggestionMap.has(sug.targetBlockId)) {
      const existing = blockSuggestionMap.get(sug.targetBlockId)!;
      warnings.push(
        `Conflicting suggestions targeting block "${sug.targetBlockId}": ` +
        `Suggestion "${sug.id}" overrides prior suggestion "${existing.id}".`
      );
    }
    blockSuggestionMap.set(sug.targetBlockId, sug);
  });

  let appliedCount = 0;
  const newBlocks: ContentBlock[] = sourceDoc.blocks.map(originalBlock => {
    if (blockSuggestionMap.has(originalBlock.id)) {
      const sug = blockSuggestionMap.get(originalBlock.id)!;

      // SAFEGUARD: Cross-document identity check
      if (sug.documentId && sug.documentId !== sourceDoc.id) {
        warnings.push(
          `Cross-document application blocked: Suggestion "${sug.id}" belongs to document "${sug.documentId}", not target document "${sourceDoc.id}".`
        );
        blockedSuggestionIds.push(sug.id);
        return { ...originalBlock };
      }

      // SAFEGUARD: Stale source protection
      // Verify that originalContent still strictly matches the target block in sourceDoc
      if (sug.originalContent !== originalBlock.content) {
        warnings.push(
          `Stale source detected for block "${originalBlock.id}": Current document content does not match the suggestion baseline originalContent. ` +
          `Suggestion "${sug.id}" was blocked from application to prevent overwriting updated content. Re-evaluation required.`
        );
        blockedSuggestionIds.push(sug.id);
        return { ...originalBlock }; // Leave original block completely untouched!
      }

      // SAFEGUARD: Outdated review protection
      if (sug.isOutdated) {
        warnings.push(
          `Application blocked: Suggestion "${sug.id}" for block "${originalBlock.id}" is flagged as outdated (${sug.outdatedReason || 'source changed'}). Re-evaluation required.`
        );
        blockedSuggestionIds.push(sug.id);
        return { ...originalBlock }; // Leave original block completely untouched!
      }

      appliedCount++;
      appliedSuggestionIds.push(sug.id);

      // Use modifiedContent if educator customized it, otherwise suggestedContent
      const updatedText = (sug.status === 'modified' && sug.modifiedContent)
        ? sug.modifiedContent
        : sug.suggestedContent;

      return {
        ...originalBlock,
        content: updatedText,
        metadata: {
          ...originalBlock.metadata,
          refactoredFromSuggestionId: sug.id,
          originalContent: originalBlock.content,
          reviewerRationale: reviewerRationale || sug.reviewerNotes,
          refactoredAt: new Date().toISOString()
        }
      };
    }
    return { ...originalBlock };
  });

  const timestamp = new Date().toISOString();
  const versionString = newVersionName?.trim() || `${sourceDoc.version}.1-refactored`;
  const sanitizedVersionId = versionString.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

  const newDocument: ContentDocument = {
    id: `${sourceDoc.id}-${sanitizedVersionId}`,
    title: `${sourceDoc.title} (Refactored)`,
    version: versionString,
    author: sourceDoc.author ? `${sourceDoc.author} (AI-Assisted Review)` : 'Curriculum Review Panel',
    blocks: newBlocks,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    newDocument,
    appliedCount,
    unaffectedCount: sourceDoc.blocks.length - appliedCount,
    warnings,
    appliedSuggestionIds,
    blockedSuggestionIds,
    reviewerRationale
  };
}
