/**
 * Current schema version for CombinedDataset persistence and interchange.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Core content block represents a single pedagogical unit or concept.
 */
export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'image' | 'video' | 'interaction';
  content: string;
  metadata?: Record<string, unknown>;
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
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
  documentId?: string; // Explicit document association for unambiguous traceability
  type: 'merge' | 'gap' | 'update' | 'clarity' | 'sequence';
  originalContent: string;
  suggestedContent: string;
  modifiedContent?: string; // Content after user manual adjustment
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  reviewedAt?: string;
  reviewerNotes?: string; // Human review rationale or notes for this decision
  isOutdated?: boolean; // Flagged if underlying block content changed after generation/review
  outdatedReason?: string;
}

/**
 * The full state of the tool's loaded data.
 */
export interface CombinedDataset {
  schemaVersion: number;
  exportedAt?: string;
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

/**
 * Structured Human-AI Decision Record for governance exports.
 */
export interface HumanDecisionRecord {
  generatedAt: string;
  schemaVersion: number;
  governance: {
    aiInvolvement?: string;
    assumptions?: string;
    risks?: string;
    rationale?: string;
    reviewNotes?: string;
  };
  metrics: {
    totalSuggestions: number;
    pendingCount: number;
    acceptedCount: number;
    modifiedCount: number;
    rejectedCount: number;
    acceptanceRatePercent: number;
  };
  decisions: Array<{
    suggestionId: string;
    documentId?: string;
    documentTitle?: string;
    targetBlockId: string;
    type: string;
    status: 'pending' | 'accepted' | 'rejected' | 'modified';
    originalContent: string;
    effectiveContent: string;
    rationale: string;
    reviewedAt?: string;
    reviewerNotes?: string;
  }>;
}

/**
 * Result of validating an imported or migrated dataset.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  dataset?: CombinedDataset;
}
