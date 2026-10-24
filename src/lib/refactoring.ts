import type { ContentBlock, LearningOutcome, RefactoringSuggestion } from '../types';
import { checkBlockAlignment } from './analysis/alignment';
import { detectBlockDuplicates } from './analysis/deduplication';

export { applyRefactoringToDocument, type ApplyRefactoringResult } from './refactoring/applyRefactoring';
export { generateRecommendations, generateAllRecommendations, reconcileSuggestions } from './analysis/recommendationEngine';
export { analyzeBloomVerb, checkOutcomesQuality, BLOOM_DOMAINS, VAGUE_VERBS, type VerbAnalysisResult, type CognitiveDomain } from './analysis/bloomsTaxonomy';
export { computeWordDiff, type DiffChunk } from './processing/diff';

/**
 * Checks if a content block aligns with the provided learning outcomes
 * using token-based semantic overlap and pedagogical term preservation.
 */
export function checkOutcomeAlignment(block: ContentBlock, learningOutcomes: LearningOutcome[]): string[] {
  if (block.type === 'heading' || !block.content.trim() || learningOutcomes.length === 0) {
    return [];
  }
  const alignment = checkBlockAlignment(block, learningOutcomes);
  if (alignment.isWeaklyAligned) {
    return ['Weak alignment: Content does not explicitly address any target learning outcomes.'];
  }
  return [];
}

/**
 * Detects near-duplicate or identical blocks across the dataset
 * using bounded Jaccard similarity and token sets.
 */
export function detectConsistencyIssues(blocks: ContentBlock[]): { blockId: string, type: 'Potential Duplicate' | 'Exact Duplicate' }[] {
  const duplicates = detectBlockDuplicates(blocks);
  return duplicates.map(d => ({
    blockId: d.blockId,
    type: d.type
  }));
}

/**
 * Calculates analytics based on refactoring suggestions and user status.
 */
export function getRefactoringAnalytics(suggestions: RefactoringSuggestion[]) {
  const list = suggestions || [];
  const total = list.length;
  const accepted = list.filter(s => s.status === 'accepted').length;
  const modified = list.filter(s => s.status === 'modified').length;
  const rejected = list.filter(s => s.status === 'rejected').length;
  const pending = list.filter(s => s.status === 'pending').length;

  const areas = {
    clarity: list.filter(s => s.type === 'clarity').length,
    alignment: list.filter(s => s.type === 'update' || s.type === 'gap').length,
    structural: list.filter(s => s.type === 'sequence' || s.type === 'merge').length
  };

  // Accepted or modified reflect adopted suggestions
  const adopted = accepted + modified;

  return {
    total,
    accepted,
    modified,
    rejected,
    pending,
    acceptanceRate: total > 0 ? (adopted / total) * 100 : 0,
    improvementAreas: areas
  };
}
