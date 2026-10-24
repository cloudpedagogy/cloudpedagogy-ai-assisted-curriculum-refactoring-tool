import type { ContentBlock } from '../../types';
import { calculateTokenJaccard } from './tokenization';

export interface DuplicateMatch {
  blockId: string;
  matchingBlockId: string;
  type: 'Exact Duplicate' | 'Potential Duplicate';
  similarity: number;
}

/**
 * Detects exact and near-duplicate content blocks across a set of blocks.
 */
export function detectBlockDuplicates(
  blocks: ContentBlock[],
  nearDuplicateThreshold = 0.75
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const b1 = blocks[i];
    if (b1.type === 'heading' || !b1.content.trim()) continue;

    for (let j = i + 1; j < blocks.length; j++) {
      const b2 = blocks[j];
      if (b2.type === 'heading' || !b2.content.trim()) continue;

      const pairKey = [b1.id, b2.id].sort().join('::');
      if (processedPairs.has(pairKey)) continue;

      const sim = calculateTokenJaccard(b1.content, b2.content);

      if (sim === 1.0 || b1.content.trim().toLowerCase() === b2.content.trim().toLowerCase()) {
        processedPairs.add(pairKey);
        matches.push({
          blockId: b1.id,
          matchingBlockId: b2.id,
          type: 'Exact Duplicate',
          similarity: 1.0
        });
        matches.push({
          blockId: b2.id,
          matchingBlockId: b1.id,
          type: 'Exact Duplicate',
          similarity: 1.0
        });
      } else if (sim >= nearDuplicateThreshold) {
        processedPairs.add(pairKey);
        matches.push({
          blockId: b1.id,
          matchingBlockId: b2.id,
          type: 'Potential Duplicate',
          similarity: Math.round(sim * 100) / 100
        });
        matches.push({
          blockId: b2.id,
          matchingBlockId: b1.id,
          type: 'Potential Duplicate',
          similarity: Math.round(sim * 100) / 100
        });
      }
    }
  }

  return matches;
}
