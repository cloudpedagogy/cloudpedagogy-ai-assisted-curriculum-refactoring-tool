import type {
  ContentDocument,
  CombinedDataset,
  RefactoringSuggestion
} from '../../types';
import { checkBlockAlignment } from './alignment';
import { analyzeBlockReadability } from './readability';
import { detectBlockDuplicates } from './deduplication';

/**
 * Deterministic hash generator for reproducible suggestion IDs.
 */
function createSuggestionId(docId: string, blockId: string, ruleType: string): string {
  const seed = `${docId}-${blockId}-${ruleType}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return `sug-${ruleType}-${Math.abs(hash).toString(36).slice(0, 7)}`;
}

/**
 * Reconciles existing suggestions against current document state.
 *
 * Enforces strict human decision preservation:
 * - Accepted, modified, and rejected decisions and reviewer notes are NEVER silently discarded or overwritten.
 * - If underlying block content has drifted since review, the decision is preserved but explicitly flagged for re-evaluation.
 */
export function reconcileSuggestions(
  existingSuggestions: RefactoringSuggestion[],
  documents: ContentDocument[]
): {
  reconciled: RefactoringSuggestion[];
  outdatedCount: number;
} {
  let outdatedCount = 0;
  const docMap = new Map(documents.map(d => [d.id, d]));

  const reconciled = existingSuggestions.map(sug => {
    if (!sug.documentId || !docMap.has(sug.documentId)) {
      return sug;
    }

    const doc = docMap.get(sug.documentId)!;
    const currentBlock = doc.blocks.find(b => b.id === sug.targetBlockId);

    // If block content changed and the suggestion was already reviewed, flag for re-evaluation
    if (currentBlock && currentBlock.content !== sug.originalContent) {
      if (sug.status !== 'pending' && !sug.isOutdated) {
        outdatedCount++;
        return {
          ...sug,
          isOutdated: true,
          outdatedReason: 'Underlying block content has changed since this review was recorded. Re-evaluation required before application.'
        };
      }
    } else if (currentBlock && currentBlock.content === sug.originalContent && sug.isOutdated) {
      // Content matches again (e.g. edit reverted)
      return {
        ...sug,
        isOutdated: false,
        outdatedReason: undefined
      };
    }

    return sug;
  });

  return { reconciled, outdatedCount };
}

/**
 * Analyzes a curriculum document against course outcomes and stylistic standards
 * to generate concrete, explainable, rule-assisted refactoring recommendations.
 *
 * NOTE: These recommendations are deterministic heuristic indicators designed to
 * assist academic evaluation; they do not represent autonomous AI assertions of pedagogical quality.
 */
export function generateRecommendations(
  document: ContentDocument,
  dataset: CombinedDataset
): RefactoringSuggestion[] {
  const recommendations: RefactoringSuggestion[] = [];
  const existingSugIds = new Set(dataset.suggestions.map(s => s.id));

  const allBlocks = dataset.documents.flatMap(d => d.blocks);
  const duplicateMatches = detectBlockDuplicates(allBlocks);

  document.blocks.forEach(block => {
    if (block.type === 'heading' || !block.content.trim()) return;

    // 1. Check for Duplicate or Near-Duplicate Content
    const dups = duplicateMatches.filter(m => m.blockId === block.id);
    if (dups.length > 0) {
      const match = dups[0];
      const matchDoc = dataset.documents.find(d => d.blocks.some(b => b.id === match.matchingBlockId));
      const matchDocTitle = matchDoc ? `"${matchDoc.title}"` : 'the curriculum registry';
      const id = createSuggestionId(document.id, block.id, 'merge');

      if (!existingSugIds.has(id)) {
        recommendations.push({
          id,
          documentId: document.id,
          targetBlockId: block.id,
          type: 'merge',
          originalContent: block.content,
          suggestedContent: block.content, // user can modify to consolidate
          rationale: `Heuristic Redundancy Indicator: This content has ${match.similarity * 100}% similarity with block ${match.matchingBlockId} in ${matchDocTitle}. Consider deduplicating or consolidating cross-version content.`,
          status: 'pending'
        });
        existingSugIds.add(id);
      }
    }

    // 2. Check Readability & Writing Style (Clarity)
    const readabilityIssues = analyzeBlockReadability(block);
    readabilityIssues.forEach(issue => {
      const id = createSuggestionId(document.id, block.id, `clarity-${issue.type}`);
      if (!existingSugIds.has(id)) {
        let suggestedContent = block.content;
        let suggestionRationale = issue.message;

        if (issue.type === 'passive-voice') {
          // Provide clean active voice candidate
          suggestedContent = block.content
            .replace(/\bis defined as the\b/i, 'is the')
            .replace(/\bis defined as\b/i, 'refers to')
            .replace(/\bare considered to be\b/i, 'are')
            .replace(/\bcan be observed that\b/i, 'shows that');
          suggestionRationale = `Heuristic Clarity Recommendation: Replaced passive phrasing ("${issue.evidence}") with concise academic active voice.`;
        }

        recommendations.push({
          id,
          documentId: document.id,
          targetBlockId: block.id,
          type: 'clarity',
          originalContent: block.content,
          suggestedContent: suggestedContent !== block.content ? suggestedContent : block.content,
          rationale: suggestionRationale,
          status: 'pending'
        });
        existingSugIds.add(id);
      }
    });

    // 3. Check Learning Outcome Alignment (Diagnostic Review)
    // NOTE: Genuine instructional alignment cannot be established deterministically without academic domain knowledge.
    // The engine produces a diagnostic review recommendation and preserves existing text rather than mechanically appending keywords.
    const alignment = checkBlockAlignment(block, dataset.learningOutcomes);
    if (alignment.isWeaklyAligned && dataset.learningOutcomes.length > 0) {
      const id = createSuggestionId(document.id, block.id, 'gap');
      if (!existingSugIds.has(id)) {
        const primaryOutcome = dataset.learningOutcomes[0];
        recommendations.push({
          id,
          documentId: document.id,
          targetBlockId: block.id,
          type: 'gap',
          originalContent: block.content,
          suggestedContent: block.content, // Preserves original content; avoids artificial keyword appending
          rationale: `Diagnostic Alignment Review: Block displays minimal explicit keyword overlap with target learning outcomes (e.g. Outcome "${primaryOutcome.statement}"). Review whether this section directly supports intended learning goals or requires contextual clarification.`,
          status: 'pending'
        });
        existingSugIds.add(id);
      }
    }
  });

  return recommendations;
}

/**
 * Generates recommendations across all documents in a dataset.
 */
export function generateAllRecommendations(dataset: CombinedDataset): RefactoringSuggestion[] {
  const allSuggestions: RefactoringSuggestion[] = [];
  dataset.documents.forEach(doc => {
    const docSuggestions = generateRecommendations(doc, dataset);
    allSuggestions.push(...docSuggestions);
  });
  return allSuggestions;
}
