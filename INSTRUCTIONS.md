# Instructions: AI-Assisted Curriculum Refactoring Tool

This guide provides detailed instructions for setting up, running, and using the AI-Assisted Curriculum Refactoring Tool locally.

## 🛠️ Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### 2. Installation
Open your terminal in the project root directory and run:
```bash
npm install
```

### 3. Running the Development Server
To start the application in development mode with Hot Module Replacement (HMR):
```bash
npm run dev
```
Once started, the app will be available at `http://localhost:5173/`.

### 4. Building for Production
To generate a highly optimized static build in the `dist` folder:
```bash
npm run build
```

### 5. Previewing the Production Build
To test the production build locally:
```bash
npm run preview
```

---

## 📖 Usage Guide

### 📂 Explorer Mode
- **Goal**: Review individual curriculum documents.
- **How-to**: Click on any course version in the left-hand list to view its full pedagogical structure and content blocks.

### ⚔️ Comparison Mode
- **Goal**: Perform side-by-side diffing between two curriculum versions.
- **How-to**: 
  1. Toggle to **Comparison** mode in the top navigation.
  2. Select two versions from the list.
  3. View matched, modified, and removed blocks highlighted with semantic status tags.

### ✨ Refactoring & Governance Mode
- **Goal**: Evaluate AI-assisted improvements with human oversight.
- **How-to**:
  1. Navigate to the **Refactoring** tab.
  2. Review the **AI-assisted suggestions** (clearly labeled with rationales).
  3. Use the decision controls:
     - **Accept**: Commit the suggestion as a curriculum refinement.
     - **Modify**: Edit the suggestion text before acceptance.
     - **Reject**: Dismiss the suggestion.
  4. Monitor the **Governance Metrics** in the dashboard to track review progress.

---

## 🏛️ Privacy & Local-First
- All data is processed **locally in your browser**.
- Refactoring decisions are persisted in your browser's `localStorage`.
- No curriculum content or decision data is transmitted to external servers.
