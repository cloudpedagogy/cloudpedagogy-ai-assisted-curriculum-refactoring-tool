import React, { useState } from 'react';
import type { CombinedDataset } from '../types';
import {
  parseAndValidateImport,
  exportDatasetAsJson,
  exportCurriculumAsMarkdown,
  exportDecisionRecordAsJson,
  exportDecisionRecordAsMarkdown,
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

type ExportFormat = 'dataset-json' | 'curriculum-md' | 'decision-md' | 'decision-json';

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
  const [exportFormat, setExportFormat] = useState<ExportFormat>('dataset-json');
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [copyFeedback, setCopyFeedback] = useState(false);

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
          filename: `human-ai-decision-record-${timestamp}.md`,
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

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-export-title"
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
        className="modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}
      >
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
              Curriculum Data Interchange
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#555555' }}>
              Import external curriculum files or export validated datasets and governance records.
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
            Export Formats
          </button>
          <button
            onClick={() => handleTabChange('import')}
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
            Import Curriculum
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'export' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!dataset ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#555555' }}>
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
                        onClick={() => setExportFormat('dataset-json')}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${exportFormat === 'dataset-json' ? '#111111' : '#e0e0e0'}`,
                          background: exportFormat === 'dataset-json' ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Full Dataset (JSON)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Schema v1 full backup for re-import or Curriculum Studio
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
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Curriculum (Markdown)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Academic syllabus with outcomes and content blocks
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
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Decision Record (Markdown)</div>
                        <div style={{ fontSize: '0.75rem', color: '#555555', marginTop: '0.2rem' }}>
                          Human–AI governance report with reviewer notes
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
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCopyClipboard}
                    >
                      {copyFeedback ? '✓ Copied to Clipboard' : 'Copy to Clipboard'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleDownload}
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
                  Validate & Ingest Curriculum
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
