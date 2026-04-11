import type { ContentBlock, LearningOutcome, RefactoringSuggestion } from '../types';

/**
 * Checks if a content block aligns with the provided learning outcomes.
 * Uses simple keyword overlap matching.
 */
export function checkOutcomeAlignment(block: ContentBlock, learningOutcomes: LearningOutcome[]): string[] {
  const content = block.content.toLowerCase();
  const warnings: string[] = [];

  // Very simple check: does any part of the block mention keywords from outcomes?
  // In a real system, this would be more sophisticated.
  const hasOutcomeMatch = learningOutcomes.some(outcome => {
    const keywords = outcome.statement.toLowerCase().split(' ').filter(word => word.length > 4);
    return keywords.some(keyword => content.includes(keyword));
  });

  if (!hasOutcomeMatch && block.type !== 'heading') {
    warnings.push('Weak alignment: Content does not explicitly address any target learning outcomes.');
  }

  return warnings;
}

/**
 * Detects near-duplicate or identical blocks across the dataset.
 */
export function detectConsistencyIssues(blocks: ContentBlock[]): { blockId: string, type: 'Potential Duplicate' | 'Exact Duplicate' }[] {
  const issues: { blockId: string, type: 'Potential Duplicate' | 'Exact Duplicate' }[] = [];
  const contentMap = new Map<string, string[]>(); // content -> [blockIds]

  blocks.forEach(block => {
    const normalized = block.content.trim().toLowerCase();
    if (!contentMap.has(normalized)) {
      contentMap.set(normalized, []);
    }
    contentMap.get(normalized)!.push(block.id);
  });

  contentMap.forEach((ids, _content) => {
    if (ids.length > 1) {
      ids.forEach(id => {
        issues.push({ blockId: id, type: 'Exact Duplicate' });
      });
    }
  });

  return issues;
}

/**
 * Calculates analytics based on refactoring suggestions and user status.
 */
export function getRefactoringAnalytics(suggestions: RefactoringSuggestion[]) {
  const total = suggestions.length;
  const accepted = suggestions.filter(s => s.status === 'accepted').length;
  
  const areas = {
    clarity: suggestions.filter(s => s.type === 'clarity').length,
    alignment: suggestions.filter(s => s.type === 'update' || s.type === 'gap').length,
    structural: suggestions.filter(s => s.type === 'sequence' || s.type === 'merge').length
  };

  return {
    acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
    improvementAreas: areas
  };
}
