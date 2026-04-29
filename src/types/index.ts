/**
 * Core content block represents a single pedagogical unit or concept.
 */
export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'image' | 'video' | 'interaction';
  content: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * A document representing a full lecture, handbook, or module.
 */
export interface ContentDocument {
  id: string;
  title: string;
  version: string;
  author?: string;
  blocks: ContentBlock[];
}

/**
 * A specific learning outcome associated with content or a module.
 */
export interface LearningOutcome {
  id: string;
  statement: string;
  level: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
  domain?: string;
}

/**
 * Results of comparing two ContentDocuments.
 */
export interface ComparisonResult {
  id: string;
  sourceDocId: string;
  targetDocId: string;
  similarityScore: number; // 0 to 1
  matchedBlockIds: [string, string][]; // Pairs of [sourceId, targetId]
  differences: Array<{
    type: 'added' | 'removed' | 'modified';
    sourceBlockId?: string;
    targetBlockId?: string;
    description: string;
  }>;
}

/**
 * Summary view of comparison for UI display.
 */
export interface ComparisonSummary {
  matchedCount: number;
  differenceCount: number;
  missingCount: number;
}

/**
 * AI-generated suggestion for improving curriculum content with governance state.
 */
export interface RefactoringSuggestion {
  id: string;
  targetBlockId: string;
  type: 'merge' | 'gap' | 'update' | 'clarity' | 'sequence';
  originalContent: string;
  suggestedContent: string;
  modifiedContent?: string; // Content after user manual adjustment
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  reviewedAt?: string;
}

/**
 * The full state of the tool's loaded data.
 */
export interface CombinedDataset {
  documents: ContentDocument[];
  contentBlocks: ContentBlock[];
  learningOutcomes: LearningOutcome[];
  suggestions: RefactoringSuggestion[];
  comparisons: ComparisonResult[];
  
  // Lightweight capability and governance layer
  // Optional, non-blocking, and does not alter core workflow
  aiInvolvement?: string;
  assumptions?: string;
  risks?: string;
  rationale?: string;
  reviewNotes?: string;
}
