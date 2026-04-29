# PROJECT_SPEC: cloudpedagogy-ai-assisted-curriculum-refactoring-tool

## 1. Repo Name
`cloudpedagogy-ai-assisted-curriculum-refactoring-tool`

## 2. One-Sentence Purpose
A granular content-level tool for comparing, analyzing, and refactoring curriculum materials using AI-powered suggestions.

## 3. Problem the App Solves
Difficulty in iteratively refactoring learning materials for consistency, clarity, and Bloom's Taxonomy alignment when moving between legacy and AI-enhanced curriculum versions.

## 4. Primary User / Audience
Curriculum designers, learning technologists, and educators.

## 5. Core Role in the CloudPedagogy Ecosystem
Handles the granular *content* and *instructional design* layer, supplementing high-level mapping tools with specific block-level rewrite suggestions and similarity analysis.

## 6. Main Entities / Data Structures
- **ContentDocument**: A collection of logical content blocks representing a unit of curriculum.
- **ContentBlock**: The most granular data unit (paragraph, list, interaction, etc.).
- **LearningOutcome**: Statements classified by Bloom's Taxonomy levels.
- **RefactoringSuggestion**: AI-generated proposed edits (merge, gap, update) with explicit rationale.
- **ComparisonResult**: Data mapping similarities and differences between two document versions.

## 7. Main User Workflows
1. **Document Import**: Upload source and target versions of curriculum content.
2. **Comparison Execution**: Run similarity analysis to identify matched and orphaned content blocks.
3. **Suggestion Review**: Evaluate AI-generated suggestions for refactoring content.
4. **Finalization**: Accept, reject, or modify suggested changes to produce a refactored document.

## 8. Current Features
- Granular block-level data management.
- Document comparison interface.
- Similarity scoring and matching.
- Rationale-backed suggestions.
- Bloom's Taxonomy classification for outcomes.

## 9. Stubbed / Partial / Incomplete Features
- Not explicitly defined, though granular metadata fields for `ContentBlock` are listed as optional.

## 10. Import / Export and Storage Model
- **Storage**: Browser `localStorage` (`curriculum_refactoring_tool_data`).
- **Import/Export**: JSON-based full dataset serialization.

## 11. Relationship to Other CloudPedagogy Apps
Operates at a lower level of abstraction than the `mapping-engine`; refactored outcomes and content could eventually feed higher-order mapping or simulation datasets.

## 12. Potential Overlap or Duplication Risks
Minimal overlap with general assessment tools; specialized in the "Document vs. Document" refactoring workflow.

## 13. Distinctive Value of This App
The most granular tool in the suite; provides an explicit audit trail of "Rationale" for every suggested curriculum edit.

## 14. Recommended Future Enhancements
(Inferred) Direct API integration with Learning Management Systems (LMS) for content push/pull; expanded taxonomy support beyond Bloom's.

## 15. Anything Unclear or Inferred from Repo Contents
The specific AI model requirements for generating `RefactoringSuggestion` rationale are inferred as external but provided via the tool's interface logic.

## Capability and Governance Alignment

This tool is aligned with the CloudPedagogy Capability and Governance standard.

- Capability: The tool supports development of practical AI capability through structured interaction and workflow use.
- Governance: The tool includes lightweight, optional fields that make assumptions, risks, and decisions visible and reviewable.

This alignment ensures the tool supports both effective use of AI and responsible, accountable practice.
