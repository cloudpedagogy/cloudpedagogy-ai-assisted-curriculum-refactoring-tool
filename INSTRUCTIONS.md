# AI-Assisted Curriculum Refactoring Tool — User Instructions

---
### 2. What This Tool Does
This application provides AI-supported harmonization and improvement of curriculum text. It ensures that locally drafted learning outcomes and assessment criteria adhere to institutional guidelines and recognized academic frameworks (like Bloom's Taxonomy).

---
### 3. Role in the Ecosystem
- **Phase:** Phase 4 — Curriculum Extensions
- **Role:** AI-supported harmonization and improvement of curriculum content.
- **Reference:** [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---
### 4. When to Use This Tool
- When a draft curriculum is structurally sound but poorly written or inconsistent.
- When an old curriculum requires rapid updating to meet new institutional formatting standards.
- To ensure action verbs in learning outcomes are measurable and appropriate for the academic level.

---
### 5. Inputs
- Manual text entry of draft curriculum documentation, or structured JSON import from upstream curriculum design tools.

---
### 6. How to Use (Step-by-Step)
1. Load or paste your draft learning outcomes and assessment descriptions.
2. Select the target framework or harmonization goal (e.g., "Align to Bloom's Level 6", "Standardize Institutional Tone").
3. Review the AI-generated suggestions compared side-by-side with the original text.
4. Accept, reject, or manually edit the suggestions locally.
5. Crucially, explicitly document your rationale for accepting sweeping AI changes.
6. Export the refined text as a JSON or Markdown file.

---
### 7. Key Outputs
- Clean, harmonized academic text ready for publication or committee review.
- A log of accepted changes confirming human oversight of the rewriting process.

---
### 8. How It Connects to Other Tools
- **Upstream:** Generally refines draft texts from the **Mapping Engine** or **Shared Module Repository**.
- **Downstream:** Because it uses AI to generate content, heavy use might require documentation via the **Human-AI Decision Record**.

---
### 9. Limitations
- The AI focuses on form and structure; it cannot verify if the academic *content* is factually correct.
- High risk of generating homogenization if staff accept all suggestions without critical thought.

---
### 10. Tips
- Use this tool explicitly for "refactoring" (improving existing foundations), never for "generation from zero."

---
### 11. Capability and Governance

This tool supports both AI capability development and lightweight governance.

- **Capability:** is developed through structured interaction with real workflows, allowing users to build practical judgement regarding AI outputs.
- **Governance:** is supported through an optional, collapsible "Capability & Governance Notes" section at the bottom of the interface. This makes assumptions, risks, and decisions visible.
- **Optional Fields:** The section includes fields for AI Involvement, Assumptions, Risks or concerns, Rationale, and Human review notes. All governance inputs are optional and designed to support — not constrain — professional judgement.
