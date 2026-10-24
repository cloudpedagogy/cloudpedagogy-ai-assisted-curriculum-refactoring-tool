# CloudPedagogy Curriculum Studio Interchange Specification

**Document Version:** 1.0  
**Application:** AI-Assisted Curriculum Refactoring Tool (AACRT)  
**Target Ingestion:** CloudPedagogy Curriculum Studio  
**Schema Version:** `1` (Contract `v1`)  
**Status:** Canonical Interface Specification  

---

## 1. Architectural Scope and Boundaries

The CloudPedagogy AI-Assisted Curriculum Refactoring Tool (AACRT) is an independently functioning, local-first, open-source web application designed for academic review panels and educators.

### Separation of Concerns
* **AACRT Standalone Role:**
  * Runs entirely client-side in the browser.
  * Authors, analyses, and refactors individual curriculum documents and syllabi.
  * Executes deterministic heuristic diagnostics (Bloom's Taxonomy verb detection, tokenised outcome alignment, sentence readability, and cross-document Jaccard deduplication).
  * Captures human educator decisions (`accepted`, `modified`, `rejected`) and reviewer rationale.
  * Produces versioned, refactored curriculum documents and institutional governance audit records.
* **Curriculum Studio Role (Downstream Platform):**
  * Ingests validated datasets and human decision records produced by AACRT.
  * Coordinates multi-module curriculum portfolios across departments.
  * Connects module structures to simulation engines and institutional registries.
* **Explicit Non-Goals for this Repository:**
  * No commercial Studio shell, licensing, cross-application orchestration, or Tauri desktop packaging is implemented in this repository.
  * Shared schemas are not prematurely imposed across the other ecosystem tools.

---

## 2. Dataset Contract (`schemaVersion: 1`)

All curriculum interchange payloads between AACRT and Curriculum Studio must adhere to `schemaVersion: 1`.

```typescript
export interface CombinedDataset {
  schemaVersion: number; // Canonical version: 1
  documents: ContentDocument[];
  contentBlocks?: ContentBlock[]; // Legacy backward-compatibility only
  learningOutcomes: LearningOutcome[];
  suggestions: RefactoringSuggestion[];
  comparisons: ComparisonResult[];
  
  // Institutional capability and governance declarations
  aiInvolvement?: string;
  assumptions?: string;
  risks?: string;
  rationale?: string;
  reviewNotes?: string;
}
```

### Document and Block Hierarchy
The canonical **source of truth** for curriculum structure is each document's internal `blocks` array:

```typescript
export interface ContentDocument {
  id: string;              // Deterministic alphanumeric identifier (e.g. "doc-v1", "cs-101")
  title: string;           // Course or module title
  version: string;         // SemVer or version tag (e.g. "1.0", "1.1-refactored")
  author?: string;         // Academic lead or review panel
  blocks: ContentBlock[];  // Ordered sequence of content blocks
  createdAt?: string;      // ISO 8601 timestamp
  updatedAt?: string;      // ISO 8601 timestamp
}

export interface ContentBlock {
  id: string;              // Block identifier unique within document (e.g. "b1", "v1-b2")
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'callout';
  content: string;         // Raw text content
  order?: number;          // Zero-indexed display order
  metadata?: {
    refactoredFromSuggestionId?: string; // Links refactored block to source suggestion ID
    originalContent?: string;            // Pre-refactoring text baseline
    reviewerRationale?: string;          // Educator sign-off rationale
    refactoredAt?: string;               // ISO 8601 timestamp of refactoring
    [key: string]: unknown;
  };
}
```

### Learning Outcome Contract
```typescript
export interface LearningOutcome {
  id: string;              // Unique outcome ID (e.g. "lo-1", "lo-2026-arch")
  statement: string;       // Measurable objective statement
  level: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
}
```

---

## 3. Versioning and Identifier Lineage

### 1. Document Versioning
* Original documents remain completely immutable during refactoring operations.
* When accepted or modified suggestions are applied, a new `ContentDocument` is generated:
  * **Title:** `${sourceDoc.title} (Refactored)`
  * **Version String:** Specified by educator or defaulted to `${sourceDoc.version}.1-refactored`.
  * **Document ID:** `${sourceDoc.id}-${sanitizedVersionId}` (e.g. `doc-101-1-1-refactored`).
  * **Lineage:** Metadata on refactored blocks links back to the original block content and suggestion ID.

### 2. Suggestion Identifiers
* Deterministic IDs generated from document ID, block ID, and heuristic rule type:
  `sug-${ruleType}-${hash}` (e.g. `sug-clarity-1`, `sug-gap-a8f2c`).

---

## 4. Human Decision Record & Governance Interchange

Downstream systems (Curriculum Studio and Institutional Governance Dashboards) consume the formal decision record to verify human oversight.

### Record Schema
```typescript
export interface HumanDecisionRecord {
  generatedAt: string;     // ISO 8601 timestamp
  schemaVersion: number;   // Contract schema version: 1
  disclaimer: string;      // Standard non-accreditation disclaimer
  governance: {
    aiInvolvement?: string;
    assumptions?: string;
    risks?: string;
    rationale?: string;
    reviewNotes?: string;
  };
  documentVersions: Array<{
    documentId: string;
    title: string;
    version: string;
    blockCount: number;
    isRefactoredVersion?: boolean;
    parentDocumentId?: string;
  }>;
  metrics: {
    totalSuggestions: number;
    pendingCount: number;
    acceptedCount: number;
    modifiedCount: number;
    rejectedCount: number;
    outdatedCount?: number;
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
    isOutdated?: boolean;
    outdatedReason?: string;
    reviewedAt?: string;
    reviewerNotes?: string;
  }>;
}
```

### Stale Source & Decision Preservation Protection
* If underlying document text is edited after a suggestion has been reviewed, downstream ingestion engines and AACRT mark the decision with `isOutdated: true`.
* Applying outdated or stale baseline suggestions is strictly blocked until an educator re-evaluates the recommendation.

---

## 5. Supported Import & Export Formats

| Format | File Extension | MIME Type | Target Use Case |
| :--- | :--- | :--- | :--- |
| **Combined Dataset JSON** | `.json` | `application/json` | Complete workspace backup; lossless ingestion into Curriculum Studio. |
| **Curriculum Syllabus Markdown** | `.md` | `text/markdown` | Human-readable academic syllabus export with outcome mappings. |
| **Institutional Governance HTML** | `.html` | `text/html` | Standalone, self-contained report with `@media print` CSS for browser Print / Save as PDF. |
| **Institutional Governance Markdown** | `.md` | `text/markdown` | Version-controlled governance audit trail for git repositories. |
| **Decision Record JSON** | `.json` | `application/json` | Machine-readable audit log for automated quality gates. |

---

## 6. Migration and Compatibility Expectations

1. **Legacy V0 Imports:**
   * Files without a `schemaVersion` property or with flat top-level `contentBlocks` arrays are automatically migrated into the V1 hierarchy.
   * Ambiguous block references that occur across multiple documents are flagged with warnings rather than arbitrarily linked.
2. **Dataset Merging:**
   * When importing with merge mode active, duplicate document IDs are automatically namespaced (`doc-id-imported`) to prevent destructive overwriting.
3. **Local Storage Resilience:**
   * Storage key: `cloudpedagogy_curriculum_refactoring_tool_dataset`.
   * Backup key: `cloudpedagogy_curriculum_refactoring_tool_dataset-backup`.
   * Corrupted primary data triggers automatic recovery from backup without data loss. Quota exceptions report actionable errors rather than falsely claiming success.
