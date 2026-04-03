import type { ContentDocument, ContentBlock, ComparisonResult } from '../../types';

/**
 * Normalizes text for comparison (lowercase, trimmed).
 */
const normalize = (text: string): string => text.toLowerCase().trim();

/**
 * Calculates a simple similarity score between two strings (0 to 1).
 */
const calculateSimilarity = (s1: string, s2: string): number => {
  if (s1 === s2) return 1;
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  if (n1 === n2) return 1;

  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  const union = new Set([...words1, ...words2]).size;

  return intersection.length / union;
};

/**
 * Compares two documents and identifies similarities and differences.
 */
export const compareDocuments = (
  source: ContentDocument,
  target: ContentDocument
): ComparisonResult => {
  const result: ComparisonResult = {
    id: `comp-${source.id}-${target.id}`,
    sourceDocId: source.id,
    targetDocId: target.id,
    similarityScore: 0,
    matchedBlockIds: [],
    differences: []
  };

  const matchedTargetIds = new Set<string>();
  const matchedSourceIds = new Set<string>();

  // Compare every source block to find a match in the target
  source.blocks.forEach(sourceBlock => {
    let bestMatch: ContentBlock | null = null;
    let maxSimilarity = 0;

    target.blocks.forEach(targetBlock => {
      if (matchedTargetIds.has(targetBlock.id)) return;
      if (sourceBlock.type !== targetBlock.type) return;

      const sim = calculateSimilarity(sourceBlock.content, targetBlock.content);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        bestMatch = targetBlock;
      }
    });

    // High similarity threshold
    if (bestMatch && maxSimilarity > 0.8) {
      result.matchedBlockIds.push([sourceBlock.id, (bestMatch as ContentBlock).id]);
      matchedTargetIds.add((bestMatch as ContentBlock).id);
      matchedSourceIds.add(sourceBlock.id);

      if (maxSimilarity < 1) {
        result.differences.push({
          type: 'modified',
          sourceBlockId: sourceBlock.id,
          targetBlockId: (bestMatch as ContentBlock).id,
          description: `Content refined between versions (Similarity: ${Math.round(maxSimilarity * 100)}%)`
        });
      }
    }
  });

  // Identify Removed blocks (in source but not in target)
  source.blocks.forEach(sb => {
    if (!matchedSourceIds.has(sb.id)) {
      result.differences.push({
        type: 'removed',
        sourceBlockId: sb.id,
        description: `Content block removed or significantly changed.`
      });
    }
  });

  // Identify Added blocks (in target but not in source)
  target.blocks.forEach(tb => {
    if (!matchedTargetIds.has(tb.id)) {
      result.differences.push({
        type: 'added',
        targetBlockId: tb.id,
        description: `New content block introduced.`
      });
    }
  });

  // Calculate overall document similarity
  result.similarityScore = result.matchedBlockIds.length / Math.max(source.blocks.length, target.blocks.length);

  return result;
};
