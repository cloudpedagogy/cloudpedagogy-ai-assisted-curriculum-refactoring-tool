import { useState } from 'react'
import './App.css'
import { demoDataset } from './data/demo'
import { loadDataset, saveDataset, clearDataset } from './lib/storage/localStorage'
import { DocumentList } from './features/content/DocumentList'
import { DocumentView } from './features/content/DocumentView'
import { ComparisonView } from './features/comparison/ComparisonView'
import { SuggestionView } from './features/suggestions/SuggestionView'
import { OutcomeManager } from './features/outcomes/OutcomeManager'
import { ImportExportModal } from './components/ImportExportModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { CombinedDataset } from './types'

type ViewMode = 'explorer' | 'comparison' | 'suggestions' | 'outcomes';

function App() {
  // Safe lazy state initialization avoiding synchronous setState in effects
  const [dataset, setDataset] = useState<CombinedDataset | null>(() => {
    return loadDataset();
  });

  const [viewMode, setViewMode] = useState<ViewMode>('explorer');

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    const initial = loadDataset();
    return initial?.documents?.[0]?.id ? [initial.documents[0].id] : [];
  });

  // Modal and notification state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'import' | 'export'>('export');
  const [statusNotification, setStatusNotification] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  const handleLoadDemo = () => {
    setDataset(demoDataset);
    const saveRes = saveDataset(demoDataset);
    if (demoDataset.documents.length > 0) setSelectedDocIds([demoDataset.documents[0].id]);
    if (saveRes.success) {
      setStatusNotification({
        type: 'info',
        message: 'Demo dataset loaded successfully (3 versions, 2 outcomes, 3 suggestions).'
      });
    } else {
      setStatusNotification({
        type: 'error',
        message: saveRes.error || 'Loaded demo in memory, but failed to persist to browser storage.'
      });
    }
  };

  const handleReset = () => {
    setDataset(null);
    setSelectedDocIds([]);
    setViewMode('explorer');
    clearDataset();
    setStatusNotification({
      type: 'info',
      message: 'Local storage reset. Data backup retained in browser storage.'
    });
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
    const saveRes = saveDataset(newDataset);
    if (!saveRes.success) {
      setStatusNotification({
        type: 'error',
        message: saveRes.error || 'Failed to persist dataset changes to browser storage.'
      });
    }
  };

  const handleImportDataset = (imported: CombinedDataset) => {
    setDataset(imported);
    const saveRes = saveDataset(imported);
    if (imported.documents.length > 0) {
      setSelectedDocIds([imported.documents[0].id]);
    }
    if (saveRes.success) {
      setStatusNotification({
        type: 'info',
        message: `Curriculum imported successfully (${imported.documents.length} document version(s) loaded).`
      });
    } else {
      setStatusNotification({
        type: 'error',
        message: saveRes.error || 'Imported curriculum in memory, but storage quota or persistence failed.'
      });
    }
  };

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // If switching to explorer, only keep the first selected doc
    if (mode === 'explorer' && selectedDocIds.length > 1) {
      setSelectedDocIds([selectedDocIds[0]]);
    }
  };

  const selectedDocs = dataset?.documents.filter(doc => selectedDocIds.includes(doc.id)) || [];
  const primaryDoc = selectedDocs.length > 0
    ? selectedDocs[0]
    : (dataset?.documents[0] || null);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="branding-header">
          <a href="https://www.cloudpedagogy.com/" target="_blank" rel="noopener noreferrer" className="cloud-pedagogy-link">
            CloudPedagogy
          </a>
        </div>
        <header className="header" role="banner">
          <div className="header-top">
            <h1>AI-Assisted Curriculum Refactoring Tool</h1>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => { setModalTab('import'); setIsModalOpen(true); }}
                aria-label="Open import curriculum dialog"
                aria-haspopup="dialog"
              >
                Import
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setModalTab('export'); setIsModalOpen(true); }}
                disabled={!dataset}
                aria-label="Open export and governance report dialog"
                aria-haspopup="dialog"
              >
                Export
              </button>
              <button className="btn btn-secondary" onClick={handleLoadDemo} aria-label="Load sample curriculum dataset">
                Load Demo Data
              </button>
              <button className="btn btn-danger" onClick={handleReset} aria-label="Reset curriculum workspace data">
                Reset Data
              </button>
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
              aria-label="Switch to Refactoring View"
            >
              Refactoring
            </button>
            <button
              className={`mode-btn ${viewMode === 'outcomes' ? 'active' : ''}`}
              onClick={() => handleModeChange('outcomes')}
              aria-pressed={viewMode === 'outcomes'}
              aria-label="Switch to Learning Outcomes View"
            >
              Learning Outcomes
            </button>
          </nav>

          <p className="description">
            A local-first tool for analysing, harmonising, and improving curriculum content through structured and governance-ready heuristic workflows.
          </p>
          <div className="disclaimer">
            <strong>Governance Note:</strong> This tool provides transparent, rule-assisted diagnostic indicators for curriculum review. Heuristic suggestions should be critically evaluated. Final decisions remain the responsibility of academic staff.
            <br /><br />
            <small>The tool is designed to support transparency, human oversight, and governance-ready decision-making.</small>
          </div>

          {statusNotification && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{
                marginTop: '1rem',
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                background: statusNotification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${statusNotification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                color: statusNotification.type === 'error' ? '#991b1b' : '#166534',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{statusNotification.message}</span>
              <button
                onClick={() => setStatusNotification(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}
        </header>

        <main id="main-content" role="main">
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

              {viewMode === 'explorer' && (
                <div className="content-explorer">
                  <DocumentList
                    documents={dataset.documents}
                    selectedDocId={primaryDoc?.id || null}
                    onSelect={handleSelectDoc}
                  />
                  <DocumentView document={primaryDoc} dataset={dataset} />
                </div>
              )}

              {viewMode === 'comparison' && (
                <ComparisonView documents={dataset.documents} />
              )}

              {viewMode === 'suggestions' && (
                <SuggestionView
                  dataset={dataset}
                  onUpdateDataset={handleUpdateDataset}
                  onSelectDocumentForView={(docId) => {
                    setSelectedDocIds([docId]);
                    setViewMode('explorer');
                  }}
                />
              )}

              {viewMode === 'outcomes' && (
                <OutcomeManager
                  dataset={dataset}
                  onUpdateDataset={handleUpdateDataset}
                />
              )}

              {/* Lightweight capability and governance layer */}
              {/* Optional, non-blocking, and does not alter core workflow */}
              <div className="governance-section" style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <details style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '600', padding: '0.5rem', backgroundColor: '#f7fafc', borderRadius: '4px', display: 'inline-block' }}>
                    Capability & Governance Notes (Optional)
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', maxWidth: '600px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong>AI Involvement</strong>
                      <input
                        type="text"
                        value={dataset.aiInvolvement || ''}
                        onChange={(e) => handleUpdateDataset({...dataset, aiInvolvement: e.target.value})}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem' }}
                        placeholder="e.g. Heuristic rule-assisted analysis for alignment and clarity"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong>Assumptions</strong>
                      <input
                        type="text"
                        value={dataset.assumptions || ''}
                        onChange={(e) => handleUpdateDataset({...dataset, assumptions: e.target.value})}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem' }}
                        placeholder="e.g. Baseline competency maps are accurate"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong>Risks or concerns</strong>
                      <input
                        type="text"
                        value={dataset.risks || ''}
                        onChange={(e) => handleUpdateDataset({...dataset, risks: e.target.value})}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem' }}
                        placeholder="e.g. Over-reliance on auto-generated outcomes"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong>Rationale</strong>
                      <input
                        type="text"
                        value={dataset.rationale || ''}
                        onChange={(e) => handleUpdateDataset({...dataset, rationale: e.target.value})}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem' }}
                        placeholder="e.g. Streamlining module redesign for 2027"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong>Human review notes</strong>
                      <textarea
                        value={dataset.reviewNotes || ''}
                        onChange={(e) => handleUpdateDataset({...dataset, reviewNotes: e.target.value})}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.85rem' }}
                        placeholder="Reviewer notes and sign-off"
                      />
                    </label>
                  </div>
                </details>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No Data Loaded</h2>
              <p>Load the demo dataset or import your own curriculum files to get started.</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleLoadDemo}>Load Demo Dataset</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setModalTab('import'); setIsModalOpen(true); }}
                >
                  Import Curriculum JSON
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="footer" role="contentinfo">
          <p className="footer-text">CloudPedagogy · Governance-ready AI and curriculum systems</p>
        </footer>

        {/* Import/Export Modal */}
        <ImportExportModal
          isOpen={isModalOpen}
          initialTab={modalTab}
          dataset={dataset}
          onClose={() => setIsModalOpen(false)}
          onImportDataset={handleImportDataset}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App
