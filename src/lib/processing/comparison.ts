import type { ContentDocument, ContentBlock, ComparisonResult } from '../../types';
import { calculateTokenJaccard } from '../analysis/tokenization';

export interface AlignedComparisonRow {
  id: string;
  status: 'matched' | 'modified' | 'added' | 'removed';
  sourceBlock?: ContentBlock;
  targetBlock?: ContentBlock;
  similarity?: number;
  description?: string;
}

/**
 * Calculates a mathematically bounded similarity score between two strings (0.0 to 1.0).
 * Prevents duplicate-word inflation and handles empty strings safely.
 */
export const calculateSimilarity = (s1: string, s2: string): number => {
  return calculateTokenJaccard(s1, s2);
};

/**
 * Compares two documents and identifies similarities, modifications, additions, and removals.
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

  if (source.blocks.length === 0 && target.blocks.length === 0) {
    result.similarityScore = 1.0;
    return result;
  }
  if (source.blocks.length === 0 || target.blocks.length === 0) {
    result.similarityScore = 0.0;
    source.blocks.forEach(sb => {
      result.differences.push({
        type: 'removed',
        sourceBlockId: sb.id,
        description: 'Block removed in target document.'
      });
    });
    target.blocks.forEach(tb => {
      result.differences.push({
        type: 'added',
        targetBlockId: tb.id,
        description: 'New content block introduced.'
      });
    });
    return result;
  }

  const matchedTargetIds = new Set<string>();
  const matchedSourceIds = new Set<string>();

  // First pass: look for exact and high-similarity matches
  source.blocks.forEach(sourceBlock => {
    let bestMatch: ContentBlock | null = null;
    let maxSimilarity = 0;

    target.blocks.forEach(targetBlock => {
      if (matchedTargetIds.has(targetBlock.id)) return;

      const sim = calculateSimilarity(sourceBlock.content, targetBlock.content);
      // Give slight preference to matching block types
      const typeBonus = sourceBlock.type === targetBlock.type ? 0.05 : 0;
      const effectiveSim = sim + typeBonus;

      if (effectiveSim > maxSimilarity) {
        maxSimilarity = effectiveSim;
        bestMatch = targetBlock;
      }
    });

    // Moderate similarity threshold for alignment (raw sim >= 0.45)
    if (bestMatch) {
      const rawSim = calculateSimilarity(sourceBlock.content, (bestMatch as ContentBlock).content);
      if (rawSim >= 0.45) {
        result.matchedBlockIds.push([sourceBlock.id, (bestMatch as ContentBlock).id]);
        matchedTargetIds.add((bestMatch as ContentBlock).id);
        matchedSourceIds.add(sourceBlock.id);

        if (rawSim < 1.0) {
          result.differences.push({
            type: 'modified',
            sourceBlockId: sourceBlock.id,
            targetBlockId: (bestMatch as ContentBlock).id,
            description: `Refined between versions (${Math.round(rawSim * 100)}% content similarity)`
          });
        }
      }
    }
  });

  // Identify Removed blocks (in source but not matched in target)
  source.blocks.forEach(sb => {
    if (!matchedSourceIds.has(sb.id)) {
      result.differences.push({
        type: 'removed',
        sourceBlockId: sb.id,
        description: 'Content block removed in target version.'
      });
    }
  });

  // Identify Added blocks (in target but not matched in source)
  target.blocks.forEach(tb => {
    if (!matchedTargetIds.has(tb.id)) {
      result.differences.push({
        type: 'added',
        targetBlockId: tb.id,
        description: 'New content block introduced in target version.'
      });
    }
  });

  const maxLen = Math.max(source.blocks.length, target.blocks.length);
  result.similarityScore = maxLen > 0 ? result.matchedBlockIds.length / maxLen : 1.0;

  return result;
};

/**
 * Builds aligned side-by-side rows for visual comparison rendering,
 * aligning corresponding source and target blocks with placeholders for added/removed items.
 */
export function buildAlignedComparisonRows(
  source: ContentDocument,
  target: ContentDocument,
  comparison: ComparisonResult
): AlignedComparisonRow[] {
  const rows: AlignedComparisonRow[] = [];
  const processedTargetIds = new Set<string>();
  const matchMap = new Map(comparison.matchedBlockIds); // sourceId -> targetId
  const diffMap = new Map<string, string>(); // sourceId or targetId -> description

  comparison.differences.forEach(d => {
    if (d.sourceBlockId) diffMap.set(d.sourceBlockId, d.description);
    if (d.targetBlockId) diffMap.set(d.targetBlockId, d.description);
  });

  // Process all source blocks in order
  source.blocks.forEach(sb => {
    if (matchMap.has(sb.id)) {
      const targetId = matchMap.get(sb.id)!;
      const tb = target.blocks.find(b => b.id === targetId);
      processedTargetIds.add(targetId);

      const sim = tb ? calculateSimilarity(sb.content, tb.content) : 1;
      const isModified = sim < 1.0;

      rows.push({
        id: `row-${sb.id}-${targetId}`,
        status: isModified ? 'modified' : 'matched',
        sourceBlock: sb,
        targetBlock: tb,
        similarity: sim,
        description: diffMap.get(sb.id)
      });
    } else {
      // Removed from source
      rows.push({
        id: `row-removed-${sb.id}`,
        status: 'removed',
        sourceBlock: sb,
        targetBlock: undefined,
        description: 'Content block removed'
      });
    }
  });

  // Append remaining added target blocks
  target.blocks.forEach(tb => {
    if (!processedTargetIds.has(tb.id)) {
      rows.push({
        id: `row-added-${tb.id}`,
        status: 'added',
        sourceBlock: undefined,
        targetBlock: tb,
        description: 'New block introduced'
      });
    }
  });

  return rows;
}
