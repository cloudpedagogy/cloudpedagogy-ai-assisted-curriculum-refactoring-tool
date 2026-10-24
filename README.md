# AI-Assisted Curriculum Refactoring Tool

A local-first, governance-ready application for analysing, harmonising, and improving curriculum content through structured and rule-assisted heuristic workflows.

## 🔗 Role in the CloudPedagogy Ecosystem

**Phase:** Phase 4 — Curriculum Extensions

**Role:**
Harmonises and refactors curriculum content by providing explainable diagnostic recommendations, word-level version comparison, and an accountable human-in-the-loop review workflow.

**Upstream Inputs:**
Module Registry assets from the **Shared Module Repository System** and structural definitions from the **Mapping Engine**.

**Downstream Outputs:**
Produces versioned, refactored curriculum documents and audit records for validation in the **Curriculum Simulation Tool** and institutional **Governance Dashboard**.

**Does NOT:**
- Manage institutional governance workflows or systemic risk audits.
- Perform detailed workload or student strain simulation.
- Impose automated AI assertions as authoritative pedagogical mandates.

This tool supports academic review panels in identifying content gaps, detecting duplicate material, harmonising learning outcomes, and producing versioned, refactored curriculum specifications with complete provenance.

🌐 **Live Hosted Version**  
[http://cloudpedagogy-ai-assisted-curriculum-refactoring-tool.s3-website.eu-west-2.amazonaws.com/](http://cloudpedagogy-ai-assisted-curriculum-refactoring-tool.s3-website.eu-west-2.amazonaws.com/)

🖼️ **Screenshot**  
![Dashboard Screenshot](assets/screenshot.png)

---

## 🚀 Key Features (Batch 2)

### 1. Pedagogical Analysis & Recommendation Engine
- **Revised Bloom's Taxonomy Indicators**: Deterministic recognition of measurable action verbs across all 6 cognitive domains (Remembering, Understanding, Applying, Analysing, Evaluating, Creating). Flags vague verbs (e.g. *understand*, *know*, *learn*) and suggests observable alternatives without overriding educator intent.
- **Tokenised Outcome Alignment**: Stopword-filtered semantic matching identifying weakly aligned blocks and curriculum coverage gaps while preserving pedagogical keywords.
- **Cross-Document Deduplication**: Bounded token-level Jaccard similarity detecting exact (100%) and near-duplicate (≥75%) content blocks across curriculum versions.
- **Academic Clarity & Style**: Detects passive voice phrasing and over-long sentences (>35 words), proposing active voice alternatives.
- **Explainable Diagnostics**: Every recommendation provides explicit document and block references, diagnostic evidence, pedagogical rationale, and proposed changes. Clearly labelled as rule-assisted heuristics rather than generative AI claims.

### 2. Real Curriculum Refactoring Workflow
- **Human Decision Controls**: Accept, modify with custom text, reject, or undo/re-evaluate suggestions before application.
- **Before-and-After Word-Level Diffing**: Switch between side-by-side view and inline LCS word diffs highlighting added and removed phrases.
- **Non-Destructive Version Creation**: Explicit confirmation dialogue to apply approved suggestions, generating a new, versioned document (`${title} (Refactored)`) while preserving the original curriculum document completely untouched.
- **Block & Version Provenance**: Maintains complete audit metadata linking source content, suggestion ID, reviewer rationale, and resulting document versions.
- **Safe Conflict Handling**: Detects and safely resolves multiple suggestions targeting the same block ID with explicit warnings.

### 3. Multi-Version Document Comparison
- **Arbitrary Pairwise Version Selection**: Select any two curriculum versions from dropdown selectors with an instant swap control.
- **Bounded Jaccard Similarity**: Mathematically sound similarity calculations ($[0.0, 1.0]$) handling repeated words and empty documents safely.
- **Aligned Side-by-Side Rows**: Aligns corresponding blocks across versions with clear placeholders for added and removed sections.
- **Word-Level Differences**: Inline word diffing for modified blocks with distinct status badges (Matched, Modified, Removed, Added).

### 4. Learning Outcome Management
- **Interactive Outcome Controls**: View, add, and edit learning outcomes and their declared cognitive levels.
- **Real-Time Bloom's Feedback**: Live diagnostic indicator as educators draft outcome statements, highlighting recognised action verbs and offering alternative suggestions for vague phrasing.

### 5. Validated Persistence & Interchange
- **Lossless Persistence**: Multi-tier browser storage with automatic backup rotation and corrupt-data recovery.
- **Human–AI Decision Records**: Generates formal governance reports in Markdown and JSON documenting reviewer decisions, adoption rates, and institutional rationale.
- **Markdown Curriculum Export**: Exports cleanly formatted academic syllabi.

---

## 📖 Getting Started

For detailed installation and usage instructions, please refer to:  
👉 **[INSTRUCTIONS.md](INSTRUCTIONS.md)**

### Quick Commands

```bash
# Install dependencies
npm install

# Run automated test suite (64 tests)
npm test

# Typecheck and lint
npm run typecheck
npm run lint

# Production build
npm run build

# Start local development server
npm run dev
```

---

## 🛡️ Disclaimer

This repository contains exploratory, framework-aligned tools developed for reflection, learning, and discussion.

These tools are provided as-is and are not compliance instruments. Outputs are indicative heuristic indicators and should be evaluated in context using professional academic judgement.

All applications run locally in the browser. No user data is collected or transmitted externally.

---

## 📜 Licensing & Scope

This repository contains open-source software released under the MIT License.

CloudPedagogy frameworks and related materials are licensed separately and are not embedded or enforced within this software.

## ☁️ About CloudPedagogy

CloudPedagogy develops open, governance-credible resources for building confident, responsible AI capability across education, research, and public service.

**Website**: [https://www.cloudpedagogy.com/](https://www.cloudpedagogy.com/)  
**Framework**: CloudPedagogy AI Capability Framework
