# AI-Assisted Curriculum Refactoring Tool — User Instructions

---

### 1. Overview
This application provides local-first, AI-assisted harmonisation and refactoring of curriculum content. It enables academic leads and curriculum designers to compare curriculum versions, evaluate suggested revisions, and maintain a verifiable human-in-the-loop audit trail.

---

### 2. What This Tool Does
- **Version Comparison**: Contrasts successive versions of curriculum modules to highlight additions, modifications, and removed sections.
- **Human Decision Governance**: Presents AI and rule-assisted suggestions alongside transparent rationale, requiring human evaluation (Accept, Modify, Reject).
- **Audit & Governance Reporting**: Generates formal Human–AI Decision Records capturing reviewer notes, institutional rationale, and adoption metrics.
- **Curriculum Ingestion & Export**: Supports lossless JSON dataset exchange, clean Markdown curriculum exports, and structured audit logs.

---

### 3. Role in the CloudPedagogy Ecosystem
- **Phase:** Phase 4 — Curriculum Extensions
- **Role:** AI-supported harmonisation and improvement of curriculum content.
- **Upstream:** Refines draft module text and structural definitions from the **Shared Module Repository** and **Mapping Engine**.
- **Downstream:** Produces refined, governance-verified curriculum drafts for the **Curriculum Simulation Tool** and institutional review boards.

---

### 4. When to Use This Tool
- When updating legacy curriculum documentation to modern institutional standards.
- When harmonising syllabus terminology, formatting, and alignment with course learning outcomes.
- When conducting formal departmental reviews that mandate an accountable audit trail for AI-assisted writing.

---

### 5. Inputs
- **Demo Dataset**: Pre-loaded multi-version Epidemiology curriculum module.
- **JSON Import**: Upload a `.json` file or paste JSON containing:
  - A complete `CombinedDataset` (schema version 1).
  - An array of `ContentDocument` objects.
  - A single `ContentDocument` object.
- **Import Modes**: Replace the active workspace or merge incoming documents into existing curriculum state.

---

### 6. Step-by-Step Usage Guide

#### Step 1: Ingest or Load Curriculum
- Click **"Load Demo Data"** to explore with the synthetic epidemiology dataset.
- Alternatively, click **"Import"** in the top navigation bar to upload or paste a JSON curriculum specification. Review any validation notices or automatic migration warnings.

#### Step 2: Explore Documents & Outcomes
- In **Explorer** mode, select course versions from the left panel.
- Inspect content blocks, headings, paragraphs, and tags.
- Review inline warning notices highlighting exact duplicate content or weak outcome alignment.

#### Step 3: Compare Multi-Version Changes
- Switch to **Comparison** mode to inspect differences between versions.
- Check the summary metric bar for matched sections, differences, and overall similarity scores.

#### Step 4: Evaluate Refactoring Suggestions
- Switch to **Refactoring** mode to review the active queue of AI-assisted improvements.
- Inspect the explicit pedagogical **Rationale** provided for each recommendation.
- Select your human review action:
  - **Accept**: Endorse the recommendation as proposed.
  - **Modify**: Edit the text directly in the inline editor to tailor the academic phrasing.
  - **Reject**: Decline the suggested change.
- Toggle **"View Audit History"** to review the chronological record of evaluated edits.

#### Step 5: Declare Governance & Capability Notes
- Expand the optional **"Capability & Governance Notes"** section at the bottom.
- Document AI involvement, baseline assumptions, identified risks, institutional rationale, and reviewer sign-off.

#### Step 6: Export Results
- Click **"Export"** in the top action bar to open the interchange dialogue.
- Select from four available export formats:
  1. **Full Dataset (JSON)**: Complete schema-validated snapshot for re-import or Curriculum Studio integration.
  2. **Curriculum (Markdown)**: Clean academic syllabus formatted with learning outcomes and block hierarchy (all versions or selected version).
  3. **Decision Record (Markdown)**: Comprehensive institutional governance report with metrics, governance declarations, and itemised decision log.
  4. **Decision Record (JSON)**: Machine-readable audit trail.
- Download the generated file or copy directly to your clipboard.

---

### 7. Data Privacy & Local Persistence
- **Zero Remote Transmission**: All processing, diffing, and storage occurs strictly in your browser.
- **Automatic Sync & Resilience**: State is persisted to browser `localStorage` with automated backup copies. If malformed data is detected, the application recovers from backup without destroying user records.

---

### 8. Verification & Development Commands

```bash
# Run unit and integration tests
npm test

# Typecheck and lint codebase
npm run typecheck
npm run lint

# Compile production bundle
npm run build

# Start Vite dev server
npm run dev
```
