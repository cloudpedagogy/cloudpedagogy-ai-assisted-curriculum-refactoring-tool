# AI-Assisted Curriculum Refactoring Tool

A local-first, governance-ready application for analysing, harmonising, and improving curriculum content through structured and rule-assisted heuristic workflows.

## 🔗 Role in the CloudPedagogy Ecosystem

**Phase:** Phase 4 — Curriculum Extensions

**Role:**
Harmonises and refactors curriculum content by providing explainable diagnostic recommendations, word-level version comparison, accessible workflows, and an accountable human-in-the-loop review mechanism.

**Upstream Inputs:**
Module Registry assets from the **Shared Module Repository System** and structural definitions from the **Mapping Engine**.

**Downstream Outputs:**
Produces versioned, refactored curriculum documents and institutional governance decision records for ingestion into **Curriculum Studio**, validation in the **Curriculum Simulation Tool**, and institutional audit trails.

**Does NOT:**
- Impose automated AI assertions as authoritative pedagogical mandates.
- Run uncontrolled external generative models or leak course IP to third parties.
- Manage institutional governance approval or systemic accreditation workflows.
- Perform detailed workload or student strain simulation.

This tool supports academic review panels in identifying content gaps, detecting duplicate material, harmonising learning outcomes, and producing versioned, refactored curriculum specifications with complete provenance.

🌐 **Live Hosted Version**  
[http://cloudpedagogy-ai-assisted-curriculum-refactoring-tool.s3-website.eu-west-2.amazonaws.com/](http://cloudpedagogy-ai-assisted-curriculum-refactoring-tool.s3-website.eu-west-2.amazonaws.com/)

🖼️ **Screenshot**  
![Dashboard Screenshot](assets/screenshot.png)

---

## 🚀 Key Capabilities (Batch 3)

### 1. Pedagogical Analysis & Diagnostic Heuristics
* **Deterministic Rule Engine:** Employs transparent, explainable algorithms rather than opaque black-box generative models. Every recommendation exposes its exact trigger evidence and rationale.
* **Revised Bloom's Taxonomy Indicators:** Recognises measurable action verbs across cognitive domains (Remembering, Understanding, Applying, Analysing, Evaluating, Creating) and flags vague verbs (e.g. *understand*, *know*, *learn*), offering observable alternatives without overriding educator intent.
* **Tokenised Outcome Alignment:** Filters stopwords and evaluates semantic token overlap between learning outcomes and content blocks. Unaligned sections generate diagnostic review prompts rather than synthetic text overwrites.
* **Cross-Document Deduplication:** Bounded token-level Jaccard similarity detecting identical (100%) and near-duplicate (≥75%) content across curriculum versions.
* **Academic Clarity & Active Voice:** Identifies passive constructions and over-long sentences (>35 words), proposing active voice alternatives.

### 2. Human-in-the-Loop Refactoring & Versioning
* **Educator Primacy:** Recommendations are purely advisory. Suggestions must be explicitly accepted, modified with bespoke educator text, or rejected.
* **Stale Source & Outdated Review Protection:** If an educator edits the underlying document block after a recommendation is generated or reviewed, the suggestion is flagged for re-evaluation and blocked from application.
* **Non-Destructive Version Creation:** Applying approved suggestions generates a brand new document version (`${title} (Refactored)`), preserving the original baseline document completely untouched.
* **Traceable Metadata Lineage:** Every refactored block captures its source suggestion ID, original content, reviewer rationale, and timestamp.

### 3. Multi-Version Document Comparison
* **Arbitrary Version Pairing:** Compare any two curriculum documents side-by-side with instant swap controls.
* **Word-Level Differences:** Inline LCS word diffs highlighting added and removed phrases with accessible annotations.
* **Structural Metrics:** Computes matched, modified, removed, and added block counts alongside bounded Jaccard similarity.

### 4. Accessibility & WCAG 2.2 AA Compliance
* **Full Keyboard Navigation:** Logical focus progression across navigation, cards, forms, and comparison views.
* **Visible Focus & Bypass Blocks:** High-contrast 2px focus indicators (`:focus-visible`) and a dedicated skip-to-content link.
* **Accessible Dialog Semantics:** Modal dialogs implement `role="dialog"`, `aria-modal="true"`, focus trapping within active controls, Escape key dismissal, and automatic focus restoration upon closing.
* **Screen-Reader Announcements:** Dynamic live regions (`aria-live="polite"`, `aria-atomic="true"`) announce analysis results, validation errors, outdated alerts, and export status.
* **Color-Independent Feedback:** Status badges and diffs combine distinct icons, text markers (`[+ Added]`, `[- Removed]`, `[~ Modified]`, `[✓ Accepted]`), and text decoration to avoid relying on colour alone.

### 5. Institutional Reporting & Governance Exports
* **Printable Standalone HTML:** Produces self-contained, publication-ready reports with `@media print` styles for direct browser Print / Save as PDF.
* **Governance Markdown & JSON Records:** Itemised audit trails capturing review metrics, acceptance rates, educator sign-offs, and version lineage.
* **Curriculum Studio Integration Ready:** Defined versioned interchange contract (`schemaVersion: 1`) documented in [CURRICULUM_STUDIO_INTERCHANGE.md](docs/CURRICULUM_STUDIO_INTERCHANGE.md).

---

## ⚠️ Known Limitations & Boundaries

1. **Deterministic Heuristics vs Pedagogical Judgment:**
   The alignment engine evaluates lexical and tokenised overlap against declared learning outcomes. It cannot infer complex disciplinary concepts or semantic equivalence without explicit keyword overlap. Heuristic findings are diagnostic indicators and must not be conflated with verified educational deficiencies.
2. **Local Browser Storage Limits:**
   Data is persisted locally in browser `localStorage`. Typical browser quotas are restricted to ~5MB. For large institutional archives, export datasets as JSON backups.

---

## 📖 Getting Started

For detailed installation and usage workflows, please refer to:
👉 **[INSTRUCTIONS.md](INSTRUCTIONS.md)**

### Quick Commands

```bash
# Install dependencies
npm install

# Run automated test suite (73 tests)
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
