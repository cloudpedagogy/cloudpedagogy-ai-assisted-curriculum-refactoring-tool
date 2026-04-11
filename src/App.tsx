import { useState, useEffect } from 'react'
import './App.css'
import { demoDataset } from './data/demo'
import { loadDataset, saveDataset, clearDataset } from './lib/storage/localStorage'
import { DocumentList } from './features/content/DocumentList'
import { DocumentView } from './features/content/DocumentView'
import { ComparisonView } from './features/comparison/ComparisonView'
import { SuggestionView } from './features/suggestions/SuggestionView'
import type { CombinedDataset } from './types'

type ViewMode = 'explorer' | 'comparison' | 'suggestions';

function App() {
  const [dataset, setDataset] = useState<CombinedDataset | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('explorer');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Initialize from storage on mount
  useEffect(() => {
    const saved = loadDataset();
    if (saved) {
      setDataset(saved);
      if (saved.documents.length > 0) setSelectedDocIds([saved.documents[0].id]);
    }
  }, []);

  const handleLoadDemo = () => {
    setDataset(demoDataset);
    saveDataset(demoDataset);
    if (demoDataset.documents.length > 0) setSelectedDocIds([demoDataset.documents[0].id]);
  };

  const handleReset = () => {
    setDataset(null);
    setSelectedDocIds([]);
    setViewMode('explorer');
    clearDataset();
  };

  const handleSelectDoc = (id: string) => {
    if (viewMode === 'explorer') {
      setSelectedDocIds([id]);
    } else if (viewMode === 'comparison') {
      // Toggle selection for comparison
      setSelectedDocIds(prev => 
        prev.includes(id) 
          ? prev.filter(i => i !== id) 
          : [...prev, id]
      );
    }
  };

  const handleUpdateDataset = (newDataset: CombinedDataset) => {
    setDataset(newDataset);
    saveDataset(newDataset);
  };

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // If switching to explorer, only keep the first selected doc
    if (mode === 'explorer' && selectedDocIds.length > 1) {
      setSelectedDocIds([selectedDocIds[0]]);
    }
  };

  const selectedDocs = dataset?.documents.filter(doc => selectedDocIds.includes(doc.id)) || [];
  const primaryDoc = selectedDocs.length > 0 ? selectedDocs[0] : null;

  return (
    <div className="app-container">
      <div className="branding-header">
        <a href="https://www.cloudpedagogy.com/" target="_blank" rel="noopener noreferrer" className="cloud-pedagogy-link">
          CloudPedagogy
        </a>
      </div>
      <header className="header">
        <div className="header-top">
          <h1>AI-Assisted Curriculum Refactoring Tool</h1>
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleLoadDemo}>Load Demo Data</button>
            <button className="btn btn-danger" onClick={handleReset}>Reset Data</button>
          </div>
        </div>

        <nav className="mode-controls" aria-label="Tool View Modes">
          <button 
            className={`mode-btn ${viewMode === 'explorer' ? 'active' : ''}`}
            onClick={() => handleModeChange('explorer')}
            aria-pressed={viewMode === 'explorer'}
            aria-label="Switch to Explorer View"
          >
            Explorer
          </button>
          <button 
            className={`mode-btn ${viewMode === 'comparison' ? 'active' : ''}`}
            onClick={() => handleModeChange('comparison')}
            aria-pressed={viewMode === 'comparison'}
            aria-label="Switch to Comparison View"
          >
            Comparison
          </button>
          <button 
            className={`mode-btn ${viewMode === 'suggestions' ? 'active' : ''}`}
            onClick={() => handleModeChange('suggestions')}
            aria-pressed={viewMode === 'suggestions'}
            aria-label="Switch to Suggestions View"
          >
            Refactoring
          </button>
        </nav>

        <p className="description">
          A local-first tool for analysing, harmonising, and improving curriculum content through structured and governance-ready AI-supported workflows.
        </p>
        <div className="disclaimer">
          <strong>Governance Note:</strong> This tool provides structured and AI-assisted support for curriculum review and improvement. AI-generated suggestions should be critically evaluated. Final decisions remain the responsibility of academic staff.
          <br /><br />
          <small>The tool is designed to support transparency, human oversight, and governance-ready decision-making.</small>
        </div>
      </header>

      <main>
        {dataset ? (
          <>
            <section className="summary-grid">
              <div className="summary-card">
                <h3>Draft Suggestions</h3>
                <div className="value">{dataset.suggestions.filter(s => s.status === 'pending').length}</div>
              </div>
              <div className="summary-card">
                <h3>Accepted / Modified</h3>
                <div className="value">{dataset.suggestions.filter(s => s.status === 'accepted' || s.status === 'modified').length}</div>
              </div>
              <div className="summary-card">
                <h3>Rejected</h3>
                <div className="value">{dataset.suggestions.filter(s => s.status === 'rejected').length}</div>
              </div>
              <div className="summary-card">
                <h3>Learning Outcomes</h3>
                <div className="value">{dataset.learningOutcomes.length}</div>
              </div>
            </section>

            <div className="content-explorer">
              <DocumentList 
                documents={dataset.documents} 
                selectedDocId={viewMode === 'explorer' ? selectedDocIds[0] || null : null} 
                onSelect={handleSelectDoc}
              />
              
              {viewMode === 'explorer' ? (
                <DocumentView document={primaryDoc} dataset={dataset} />
              ) : viewMode === 'comparison' ? (
                <ComparisonView documents={selectedDocs} />
              ) : (
                <SuggestionView 
                  dataset={dataset} 
                  onUpdateDataset={handleUpdateDataset} 
                />
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No Data Loaded</h2>
            <p>Load the demo dataset or import your own curriculum files to get started.</p>
            <button className="btn btn-primary" onClick={handleLoadDemo}>Load Demo Dataset</button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p className="footer-text">CloudPedagogy · Governance-ready AI and curriculum systems</p>
      </footer>
    </div>
  )
}

export default App
