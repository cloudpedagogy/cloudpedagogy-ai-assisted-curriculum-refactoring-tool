# PROJECT_SPEC: cloudpedagogy-ai-assisted-curriculum-refactoring-tool

## 1. Repo Name
`cloudpedagogy-ai-assisted-curriculum-refactoring-tool`

## 2. One-Sentence Purpose
A granular content-level tool for comparing, analysing, and refactoring curriculum materials using AI-powered suggestions with human-in-the-loop decision governance.

## 3. Problem the App Solves
Difficulty in iteratively refactoring learning materials for consistency, clarity, and Bloom's Taxonomy alignment when moving between legacy and AI-enhanced curriculum versions, while preserving institutional oversight and accountability.

## 4. Primary User / Audience
Curriculum designers, learning technologists, educational developers, and academic programme leads.

## 5. Core Role in the CloudPedagogy Ecosystem
Handles the granular *content* and *instructional design* layer, supplementing high-level mapping tools with specific block-level rewrite suggestions, similarity analysis, and formal decision governance.

## 6. Main Entities / Data Structures
- **ContentDocument**: A collection of logical content blocks representing a unit of curriculum (id, title, version, author, blocks).
- **ContentBlock**: The most granular data unit (id, type, content, metadata, tags).
- **LearningOutcome**: Statements classified by Bloom's Taxonomy cognitive levels.
- **RefactoringSuggestion**: Proposed pedagogical edits (merge, gap, update, clarity, sequence) with explicit rationale, targetBlockId, and documentId references.
- **ComparisonResult**: Data mapping similarities and differences between two document versions.
- **CombinedDataset (Schema Version 1)**: Unified state container with schemaVersion, documents, contentBlocks, learningOutcomes, suggestions, comparisons, and capability/governance statements.
- **HumanDecisionRecord**: Formatted governance document summarizing review metrics, capability declarations, and itemised decisions (Accepted, Modified, Rejected).

## 7. Main User Workflows
1. **Curriculum Ingestion**: Load built-in demo curriculum or import external JSON (full dataset, document array, or single document) with schema validation.
2. **Explorer & Consistency Check**: Review documents, block hierarchy, duplicate warnings, and learning outcome alignment.
3. **Comparison Execution**: Run pairwise similarity analysis across versions.
4. **Human Decision Review**: Evaluate candidate suggestions, modify text inline, accept or reject proposed edits, and review the audit trail.
5. **Governance Declaration**: Document AI involvement, pedagogical assumptions, risks, rationale, and reviewer sign-off.
6. **Data Export & Reporting**: Export full JSON datasets, formatted curriculum Markdown, or formal Human–AI Decision Records (Markdown/JSON).

## 8. Current Features (Batch 1 Complete)
- Validated and versioned data contracts (`schemaVersion: 1`).
- Single source of truth for documents and content blocks with automatic projection synchronization.
- Unambiguous document and block references for suggestions (`documentId`, `targetBlockId`).
- Multi-tier local storage resilience: automatic backups, backward-compatible schema migration (v0 to v1), and corrupted-syntax recovery.
- Complete import/export subsystem:
  - Validated JSON curriculum import with merge or replace options.
  - Full dataset JSON export.
  - Curriculum Markdown export (individual document or all versions).
  - Formal Human–AI Decision Record export in Markdown and JSON.
- Fault-tolerant React `ErrorBoundary` with diagnostic recovery export.
- Automated Vitest test suite covering validation, migration, storage recovery, serialization, and referential integrity.
- Zero ESLint errors, clean typecheck, and production Vite build.

## 9. Planned Upgrades (Batch 2 & Batch 3)
- **Batch 2**: Rule-based & heuristic pedagogical suggestion generator, Revised Bloom's Taxonomy action-verb analyzer, refactoring application engine producing new document versions, and inline word-level diffing.
- **Batch 3**: WCAG 2.1 AA accessibility audit, full integration workflow tests, and Curriculum Studio data interchange connector.

## 10. Import / Export and Storage Model
- **Storage**: Browser `localStorage` (`curriculum_refactoring_tool_data`) with automated backup (`curriculum_refactoring_tool_data_backup`).
- **Import/Export**: JSON-based dataset exchange and Markdown document/audit serialization.

## 11. Relationship to Other CloudPedagogy Apps
Operates at the content and instructional design level; refactored outcomes and materials feed into the **Curriculum Simulation Tool** and institutional **Governance Dashboard**.

## 12. Distinctive Value of This App
Provides the most granular instructional design workbench in the suite with an unyielding human-in-the-loop audit trail documenting rationale and oversight for every curriculum edit.

## 13. Capability and Governance Alignment
This tool adheres to the CloudPedagogy Capability and Governance standard:
- **Capability**: Builds practical staff judgement through direct interaction with AI and heuristic proposals.
- **Governance**: Transparent, non-blocking fields make assumptions, risks, and human sign-offs explicit and exportable.
