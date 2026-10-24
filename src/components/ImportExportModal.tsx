import React, { useState, useEffect, useRef } from 'react';
import type { CombinedDataset } from '../types';
import {
  parseAndValidateImport,
  exportDatasetAsJson,
  exportCurriculumAsMarkdown,
  exportDecisionRecordAsJson,
  exportDecisionRecordAsMarkdown,
  exportDecisionRecordAsHtml,
  downloadTextFile
} from '../lib/io';
import { mergeDatasets } from '../lib/validation/datasetValidation';

interface ImportExportModalProps {
  isOpen: boolean;
  initialTab?: 'import' | 'export';
  dataset: CombinedDataset | null;
  onClose: () => void;
  onImportDataset: (dataset: CombinedDataset) => void;
}

type ExportFormat = 'dataset-json' | 'curriculum-md' | 'decision-html' | 'decision-md' | 'decision-json';

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  initialTab = 'export',
  dataset,
  onClose,
  onImportDataset
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);

  // Import State
  const [importJsonText, setImportJsonText] = useState('');
  const [importMergeMode, setImportMergeMode] = useState<'replace' | 'merge'>('replace');
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Export State
  const [exportFormat, setExportFormat] = useState<ExportFormat>('decision-html');
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus restoration & Escape key handler
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      // Focus first actionable element
      const timer = setTimeout(() => {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Tab Change
  const handleTabChange = (tab: 'import' | 'export') => {
    setActiveTab(tab);
    setImportError(null);
    setImportWarnings([]);
    setImportSuccessMessage(null);
  };

  // Import file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      setImportError(null);
      setImportWarnings([]);
    };
    reader.onerror = () => {
      setImportError('Failed to read local file.');
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleExecuteImport = () => {
    setImportError(null);
    setImportWarnings([]);
    setImportSuccessMessage(null);

    const result = parseAndValidateImport(importJsonText);
    if (!result.success || !result.dataset) {
      setImportError(result.error || 'Validation failed.');
      setImportWarnings(result.warnings);
      return;
    }

    let finalDataset = result.dataset;
    let combinedWarnings = [...result.warnings];

    if (importMergeMode === 'merge' && dataset) {
      const mergeRes = mergeDatasets(dataset, result.dataset);
      finalDataset = mergeRes.dataset;
      combinedWarnings = [...combinedWarnings, ...mergeRes.warnings];
    }

    onImportDataset(finalDataset);
    setImportWarnings(combinedWarnings);
    setImportSuccessMessage(
      `Successfully loaded ${finalDataset.documents.length} document(s) with ${finalDataset.documents.flatMap(d => d.blocks).length} content blocks.`
    );
  };

  // Compute Export Content
  const getExportData = (): { content: string; filename: string; mime: string } => {
    if (!dataset) {
      return { content: '', filename: 'empty.txt', mime: 'text/plain' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    switch (exportFormat) {
      case 'decision-html':
        return {
          content: exportDecisionRecordAsHtml(dataset),
          filename: `institutional-governance-record-${timestamp}.html`,
          mime: 'text/html'
        };
      case 'dataset-json':
        return {
          content: exportDatasetAsJson(dataset),
          filename: `curriculum-dataset-${timestamp}.json`,
          mime: 'application/json'
        };
      case 'curriculum-md': {
        const docFilter = selectedDocId === 'all' ? undefined : selectedDocId;
        const filenamePrefix = docFilter ? `curriculum-${docFilter}` : 'curriculum-all';
        return {
          content: exportCurriculumAsMarkdown(dataset, docFilter),
          filename: `${filenamePrefix}-${timestamp}.md`,
          mime: 'text/markdown'
        };
      }
      case 'decision-md':
        return {
          content: exportDecisionRecordAsMarkdown(dataset),
          filename: `institutional-governance-record-${timestamp}.md`,
          mime: 'text/markdown'
        };
      case 'decision-json':
        return {
          content: exportDecisionRecordAsJson(dataset),
          filename: `human-ai-decision-record-${timestamp}.json`,
          mime: 'application/json'
        };
    }
  };

  const exportData = getExportData();

  const handleDownload = () => {
    if (!exportData.content) return;
    downloadTextFile(exportData.content, exportData.filename, exportData.mime);
    setDownloadFeedback(`Downloaded ${exportData.filename}`);
    setTimeout(() => setDownloadFeedback(null), 3000);
  };

  const handleCopyClipboard = async () => {
    if (!exportData.content) return;
    try {
      await navigator.clipboard.writeText(exportData.content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handlePrintHtml = () => {
    if (!exportData.content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(exportData.content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-export-title"
      aria-describedby="import-export-desc"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-card"
        tabIndex={-1}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}
      >
        {/* Live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)' }}
        >
          {copyFeedback && 'Export content copied to clipboard.'}
          {downloadFeedback && downloadFeedback}
          {importSuccessMessage && importSuccessMessage}
          {importError && `Import error: ${importError}`}
        </div>

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 id="import-export-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Curriculum Data Interchange &amp; Reporting
            </h3>
            <p id="import-export-desc" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#555555' }}>
              Import external curriculum files or export validated datasets and institutional governance records.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close interchange dialog"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#555555',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <button
            onClick={() => handleTabChange('export')}
            aria-selected={activeTab === 'export'}
            role="tab"
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'export' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid #111111' : '2px solid transparent',
              fontWeight: activeTab === 'export' ? 700 : 500,
              cursor: 'pointer',
              color: activeTab === 'export' ? '#111111' : '#555555',
              fontSize: '0.9rem'
            }}
          >
            Export &amp; Governance Reports
          </button>
          <button
            onClick={() => handleTabChange('import')}
            aria-selected={activeTab === 'import'}
            role="tab"
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'import' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'import' ? '2px solid #111111' : '2px solid transparent',
              fontWeight: activeTab === 'import' ? 700 : 500,
              cursor: 'pointer',
              color: activeTab === 'import' ? '#111111' : '#555555',
              fontSize: '0.9rem'
            }}
          >
            Import Curriculum Dataset
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {activeTab === 'export' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!dataset ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#555555', background: '#f9fafb', borderRadius: '6px' }}>
                  No dataset is currently loaded to export. Please load demo data or import curriculum first.
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      Select Export Format:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setExportFormat('decision-html')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'decision-html' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'decision-html' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        aria-pressed={exportFormat === 'decision-html'}
                        aria-label="Institutional Governance Record HTML with print and PDF support"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Governance Record (HTML / PDF)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Printable audit report with print styles for browser Save as PDF
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat('dataset-json')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'dataset-json' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'dataset-json' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        aria-pressed={exportFormat === 'dataset-json'}
                        aria-label="Full Dataset JSON schema v1"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Full Dataset (JSON)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Schema v1 full backup for re-import or Curriculum Studio
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat('decision-md')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'decision-md' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'decision-md' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        aria-pressed={exportFormat === 'decision-md'}
                        aria-label="Institutional Decision Record Markdown"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Decision Record (Markdown)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Institutional governance audit trail with reviewer rationale
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat('curriculum-md')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'curriculum-md' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'curriculum-md' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        aria-pressed={exportFormat === 'curriculum-md'}
                        aria-label="Curriculum Markdown syllabus"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Curriculum (Markdown)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Academic syllabus with outcomes and content blocks
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat('decision-json')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'decision-json' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'decision-json' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        aria-pressed={exportFormat === 'decision-json'}
                        aria-label="Decision Record JSON"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Decision Record (JSON)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Machine-readable audit trail of all accepted/modified edits
                        </div>
                      </button>
                    </div>
                  </div>

                  {exportFormat === 'curriculum-md' && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                        Document Scope:
                      </label>
                      <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e0',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="all">All Documents ({dataset.documents.length} versions)</option>
                        {dataset.documents.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.title} (v{d.version})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Preview Area */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Export Preview:
                    </label>
                    <textarea
                      readOnly
                      aria-label="Exported document preview"
                      value={exportData.content}
                      style={{
                        width: '100%',
                        height: '180px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#f9fafb',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {exportFormat === 'decision-html' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handlePrintHtml}
                        aria-label="Open report in printable format for saving as PDF"
                      >
                        🖨️ Print / Save as PDF
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCopyClipboard}
                      aria-label="Copy export content to clipboard"
                    >
                      {copyFeedback ? '✓ Copied to Clipboard' : 'Copy to Clipboard'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleDownload}
                      aria-label={`Download file ${exportData.filename}`}
                    >
                      Download {exportData.filename}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Choose a JSON File:
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.85rem' }}
                  aria-label="Upload curriculum JSON file"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Or Paste JSON Content:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste validated curriculum dataset JSON, document array, or single document JSON..."
                  aria-label="Paste curriculum JSON text"
                  style={{
                    width: '100%',
                    height: '140px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Import Destination Mode:
                </label>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMergeMode === 'replace'}
                      onChange={() => setImportMergeMode('replace')}
                    />
                    Replace entire workspace
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMergeMode === 'merge'}
                      onChange={() => setImportMergeMode('merge')}
                    />
                    Merge into active dataset
                  </label>
                </div>
              </div>

              {/* Feedback Messages */}
              {importError && (
                <div
                  role="alert"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <strong>Import Error:</strong> {importError}
                </div>
              )}

              {importWarnings.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong>Notices / Migrations:</strong>
                  <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                    {importWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importSuccessMessage && (
                <div
                  role="status"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '0.85rem'
                  }}
                >
                  ✓ {importSuccessMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setImportJsonText('');
                    setImportError(null);
                    setImportWarnings([]);
                    setImportSuccessMessage(null);
                  }}
                >
                  Clear Input
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExecuteImport}
                  disabled={!importJsonText.trim()}
                >
                  Validate &amp; Ingest Curriculum
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
