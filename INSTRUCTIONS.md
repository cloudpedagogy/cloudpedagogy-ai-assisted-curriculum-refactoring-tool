# AI-Assisted Curriculum Refactoring Tool — User Instructions

---

### 1. Overview
This application provides local-first, rule-assisted diagnostic analysis and refactoring of curriculum content. It enables academic leads, instructional designers, and curriculum panels to analyse learning outcome alignment, evaluate heuristic recommendations, apply versioned refactoring, and maintain an accountable governance audit trail.

---

### 2. What This Tool Does
- **Diagnostic Heuristic Analysis**: Identifies Revised Bloom's Taxonomy indicators, flags vague verbs, checks content-outcome alignment, detects duplicate content, and highlights clarity issues.
- **Human Decision Governance**: Evaluates recommendations through an active queue (Accept, Modify with custom text, Reject, or Undo/Re-evaluate).
- **Real Curriculum Refactoring**: Applies approved changes to create a new, versioned document (`${title} (Refactored)`) while preserving the original document completely unchanged.
- **Multi-Version Comparison**: Provides pairwise comparison between any two available versions with aligned rows, placeholders, and word-level diffing.
- **Learning Outcome Management**: Allows viewing, adding, and editing course learning outcomes with real-time Bloom's indicator guidance.
- **Audit & Governance Reporting**: Generates formal Human–AI Decision Records in Markdown and JSON capturing reviewer justifications and institutional declarations.

---

### 3. Role in the CloudPedagogy Ecosystem
- **Phase:** Phase 4 — Curriculum Extensions
- **Role:** Granular content and instructional design workbench prior to Curriculum Studio integration.
- **Upstream:** Ingests syllabus modules and competency frameworks from the **Shared Module Repository** and **Mapping Engine**.
- **Downstream:** Outputs versioned curriculum specifications and governance decision records for the **Curriculum Simulation Tool** and institutional audit dashboards.

---

### 4. Step-by-Step Usage Guide

#### Step 1: Ingest or Load Curriculum
- Click **"Load Demo Data"** in the top action bar to populate the tool with a multi-version Epidemiology curriculum.
- Alternatively, click **"Import"** to ingest your own curriculum JSON specification. Choose to either replace the active workspace or merge into existing documents.

#### Step 2: Manage Learning Outcomes & Cognitive Levels
- Click the **"Learning Outcomes"** tab in the main navigation.
- Inspect the defined learning outcomes and their detected Bloom's cognitive domains.
- Click **"+ Add Learning Outcome"** to draft a new outcome. As you type, the live indicator flags non-measurable verbs (e.g. *understand*, *know*) and suggests observable action verbs (e.g. *analyse*, *evaluate*, *demonstrate*).
- Click **"Edit"** on any existing outcome to modify the statement or adjust its declared cognitive level.

#### Step 3: Run Analysis & Evaluate Refactoring Suggestions
- Switch to the **"Refactoring"** tab to inspect the active queue.
- Click **"⚡ Run Heuristic Analysis"** to execute deterministic rules for alignment gaps, passive voice, and cross-document redundancy.
- Use the **Filter by Document** dropdown to focus on a specific curriculum module or view all documents.
- On each suggestion card:
  - Toggle between **"Side-by-Side"** and **"Inline Word Diff"** to inspect proposed edits.
  - Review the diagnostic rationale and affected block/document references.
  - Click **"+ Add Reviewer Note"** to document substantive academic justification.
  - Choose **"Accept"** to adopt the recommendation as proposed.
  - Choose **"Modify"** to open the inline text editor and write custom academic wording.
  - Choose **"Reject"** to decline the recommendation.
- Need to reconsider a decision? Click **"↩ Undo / Re-evaluate"** on any actioned suggestion or directly from the **Decision Audit Trail** tab to revert it back to pending review.

#### Step 4: Apply Approved Changes to Create a New Version
- In the **Refactoring** tab, click **"✨ Apply Approved to New Version"**.
- In the confirmation modal:
  - Select the target baseline document.
  - Set the new version identifier (e.g. `1.1-refactored`).
  - Enter the lead reviewer sign-off rationale for the institutional audit record.
  - Review the count of approved changes ready to apply. (Note: Unreviewed pending suggestions are never applied).
  - Click **"Confirm & Create Version"**.
- A new versioned document will be generated and added to the curriculum registry. The original document remains completely intact.

#### Step 5: Compare Curriculum Versions Side-by-Side
- Click the **"Comparison"** tab in the navigation.
- Select the **Source Baseline** (e.g. version `1.0`) and the **Comparison Target** (e.g. version `1.1-refactored`). Use **"⇄ Swap Versions"** to flip the baseline and target.
- Inspect the summary metrics: Matched Sections, Modified, Removed, Added, and Bounded Structural Similarity.
- Review the aligned rows: Modified blocks display word-level additions in green and removals in red strikethrough; added/removed blocks show aligned placeholders.

#### Step 6: Document Governance & Export
- Expand the **"Capability & Governance Notes"** drawer at the bottom of the page to record declared AI involvement, pedagogical assumptions, and risks.
- Click **"Export"** in the top action bar:
  - **Full Dataset (JSON)**: Schema-validated backup for storage or re-import.
  - **Curriculum (Markdown)**: Formatted syllabus with learning outcomes and block structure.
  - **Decision Record (Markdown / JSON)**: Formal institutional report documenting all reviewer decisions, reviewer notes, and adoption rates.

---

### 5. Data Privacy & Local Persistence
- **100% Local Execution**: All tokenisation, diffing, Bloom's parsing, and persistence occur exclusively in the client browser. No data is sent over the network.
- **Storage Resilience**: Multi-tier storage in browser `localStorage` includes automated backup rotation. If corrupted data is introduced, the system recovers from backup safely without overwriting good data.

---

### 6. Automated Verification Commands

```bash
# Execute all 64 automated tests
npm test

# Verify TypeScript types
npm run typecheck

# Check code formatting and linting
npm run lint

# Compile production bundle
npm run build
```
