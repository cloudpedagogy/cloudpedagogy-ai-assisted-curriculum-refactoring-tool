import type { ContentBlock, LearningOutcome, ContentDocument } from '../../types';
import { extractContentTokens } from './tokenization';

export interface OutcomeMatch {
  outcomeId: string;
  outcomeStatement: string;
  sharedTokens: string[];
  overlapScore: number;
}

export interface BlockAlignmentResult {
  blockId: string;
  matchedOutcomes: OutcomeMatch[];
  isWeaklyAligned: boolean;
  warning?: string;
}

export interface DocumentAlignmentReport {
  documentId: string;
  blockAlignments: BlockAlignmentResult[];
  uncoveredOutcomeIds: string[];
  totalBlocks: number;
  weaklyAlignedBlockCount: number;
}

/**
 * Checks alignment between a content block and a list of learning outcomes.
 * Uses content-token overlap rather than naive substring matching.
 */
export function checkBlockAlignment(
  block: ContentBlock,
  outcomes: LearningOutcome[]
): BlockAlignmentResult {
  if (block.type === 'heading' || outcomes.length === 0) {
    return {
      blockId: block.id,
      matchedOutcomes: [],
      isWeaklyAligned: false
    };
  }

  const blockTokens = new Set(extractContentTokens(block.content));
  const matchedOutcomes: OutcomeMatch[] = [];

  outcomes.forEach(lo => {
    const loTokens = extractContentTokens(lo.statement);
    const shared: string[] = [];

    loTokens.forEach(token => {
      if (blockTokens.has(token)) {
        shared.push(token);
      }
    });

    if (shared.length > 0) {
      const overlapScore = shared.length / new Set([...blockTokens, ...loTokens]).size;
      matchedOutcomes.push({
        outcomeId: lo.id,
        outcomeStatement: lo.statement,
        sharedTokens: shared,
        overlapScore: Math.round(overlapScore * 100) / 100
      });
    }
  });

  const isWeaklyAligned = matchedOutcomes.length === 0;
  const warning = isWeaklyAligned
    ? 'Heuristic notice: Block text shows minimal direct token overlap with active course learning outcomes.'
    : undefined;

  return {
    blockId: block.id,
    matchedOutcomes,
    isWeaklyAligned,
    warning
  };
}

/**
 * Generates an alignment report for an entire document across active learning outcomes.
 * Identifies orphan learning outcomes not addressed anywhere in the document.
 */
export function analyzeDocumentAlignment(
  doc: ContentDocument,
  outcomes: LearningOutcome[]
): DocumentAlignmentReport {
  const coveredOutcomeIds = new Set<string>();
  const blockAlignments: BlockAlignmentResult[] = [];

  doc.blocks.forEach(block => {
    const res = checkBlockAlignment(block, outcomes);
    blockAlignments.push(res);
    res.matchedOutcomes.forEach(mo => coveredOutcomeIds.add(mo.outcomeId));
  });

  const uncoveredOutcomeIds = outcomes
    .filter(lo => !coveredOutcomeIds.has(lo.id))
    .map(lo => lo.id);

  const weaklyAlignedBlockCount = blockAlignments.filter(
    b => b.isWeaklyAligned && doc.blocks.find(bl => bl.id === b.blockId)?.type !== 'heading'
  ).length;

  return {
    documentId: doc.id,
    blockAlignments,
    uncoveredOutcomeIds,
    totalBlocks: doc.blocks.length,
    weaklyAlignedBlockCount
  };
}
