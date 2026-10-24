import React, { useState, useEffect, useRef } from 'react';
import type { CombinedDataset, RefactoringSuggestion } from '../../types';
import { SuggestionCard } from './SuggestionCard';
import {
  getRefactoringAnalytics,
  generateAllRecommendations,
  generateRecommendations,
  applyRefactoringToDocument,
  reconcileSuggestions
} from '../../lib/refactoring';

interface SuggestionViewProps {
  dataset: CombinedDataset;
  onUpdateDataset: (newDataset: CombinedDataset) => void;
  onSelectDocumentForView?: (docId: string) => void;
}

export const SuggestionView: React.FC<SuggestionViewProps> = ({
  dataset,
  onUpdateDataset,
  onSelectDocumentForView
}) => {
  const [showAudit, setShowAudit] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyTargetDocId, setApplyTargetDocId] = useState<string>(
    dataset.documents[0]?.id || ''
  );
  const [newVersionName, setNewVersionName] = useState('');
  const [applyRationale, setApplyRationale] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const applyModalRef = useRef<HTMLDivElement>(null);
  const applyTriggerRef = useRef<HTMLButtonElement>(null);

  // Focus trapping and Escape key management for Apply Modal
  useEffect(() => {
    if (!isApplyModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsApplyModalOpen(false);
        applyTriggerRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && applyModalRef.current) {
        const focusables = applyModalRef.current.querySelectorAll<HTMLElement>(
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
    const timer = setTimeout(() => {
      const focusable = applyModalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isApplyModalOpen]);

  // Status updates
  const updateStatus = (
    id: string,
    status: 'accepted' | 'rejected' | 'modified',
    modifiedContent?: string,
    notes?: string
  ) => {
    const updatedSuggestions = dataset.suggestions.map(s =>
      s.id === id
        ? {
            ...s,
            status,
            modifiedContent: modifiedContent !== undefined ? modifiedContent : s.modifiedContent,
            reviewedAt: new Date().toISOString(),
            reviewerNotes: notes !== undefined ? notes : s.reviewerNotes
          }
        : s
    );

    onUpdateDataset({ ...dataset, suggestions: updatedSuggestions });
  };

  const handleUndo = (id: string) => {
    const updatedSuggestions = dataset.suggestions.map(s =>
      s.id === id
        ? {
            ...s,
            status: 'pending' as const,
            reviewedAt: undefined
          }
        : s
    );
    onUpdateDataset({ ...dataset, suggestions: updatedSuggestions });
    setNotification(`Suggestion "${id}" reverted to pending review.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Run deterministic heuristic analysis
  // Run deterministic heuristic analysis with human decision preservation
  const handleRunAnalysis = () => {
    // 1. Reconcile existing suggestions against current document state to detect outdated reviews
    const { reconciled, outdatedCount } = reconcileSuggestions(
      dataset.suggestions,
      dataset.documents
    );

    // 2. Generate recommendations for requested document(s)
    let newSuggestions: RefactoringSuggestion[] = [];
    if (selectedDocFilter === 'all') {
      newSuggestions = generateAllRecommendations({ ...dataset, suggestions: reconciled });
    } else {
      const targetDoc = dataset.documents.find(d => d.id === selectedDocFilter);
      if (targetDoc) {
        newSuggestions = generateRecommendations(targetDoc, { ...dataset, suggestions: reconciled });
      }
    }

    // 3. Merge: existing suggestions (and their decisions/notes) take strict priority over newly generated candidates
    const existingIds = new Set(reconciled.map(s => s.id));
    const toAdd = newSuggestions.filter(s => !existingIds.has(s.id));

    onUpdateDataset({
      ...dataset,
      suggestions: [...reconciled, ...toAdd]
    });

    let message = `Analysis complete: generated ${toAdd.length} new recommendation(s).`;
    if (outdatedCount > 0) {
      message += ` ⚠️ ${outdatedCount} previously reviewed decision(s) flagged for re-evaluation due to modified source content.`;
    } else if (toAdd.length === 0) {
      message = 'Heuristic analysis complete. All existing suggestions and decisions preserved; no new issues detected.';
    }

    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  // Open apply confirmation modal
  const handleOpenApplyModal = () => {
    const defaultDocId =
      selectedDocFilter !== 'all' ? selectedDocFilter : (dataset.documents[0]?.id || '');
    setApplyTargetDocId(defaultDocId);

    const doc = dataset.documents.find(d => d.id === defaultDocId);
    if (doc) {
      setNewVersionName(`${doc.version}.1-refactored`);
    }
    setApplyRationale('');
    setIsApplyModalOpen(true);
  };

  // Apply approved suggestions to create a brand new version
  const handleConfirmApply = () => {
    const targetDoc = dataset.documents.find(d => d.id === applyTargetDocId);
    if (!targetDoc) return;

    const result = applyRefactoringToDocument(
      targetDoc,
      dataset.suggestions,
      newVersionName.trim() || undefined,
      applyRationale.trim() || undefined
    );

    // Add new document without modifying the original document
    const updatedDocuments = [...dataset.documents, result.newDocument];

    onUpdateDataset({
      ...dataset,
      documents: updatedDocuments
    });

    setIsApplyModalOpen(false);

    let notifyMsg = `Successfully created version "${result.newDocument.version}" with ${result.appliedCount} applied change(s). Original document "${targetDoc.title}" remains unchanged.`;
    if (result.blockedSuggestionIds.length > 0) {
      notifyMsg += ` ⚠️ Note: ${result.blockedSuggestionIds.length} suggestion(s) were blocked from application due to stale or outdated source content.`;
    }
    setNotification(notifyMsg);

    if (onSelectDocumentForView) {
      onSelectDocumentForView(result.newDocument.id);
    }
  };

  const analytics = getRefactoringAnalytics(dataset.suggestions);

  // Filter suggestions by document if selected
  const filteredSuggestions = dataset.suggestions.filter(s => {
    if (selectedDocFilter === 'all') return true;
    if (s.documentId) return s.documentId === selectedDocFilter;
    const doc = dataset.documents.find(d => d.id === selectedDocFilter);
    return doc ? doc.blocks.some(b => b.id === s.targetBlockId) : true;
  });

  const pending = filteredSuggestions.filter(s => s.status === 'pending');
  const reviewed = filteredSuggestions.filter(s => s.status !== 'pending');

  const selectedTargetDoc = dataset.documents.find(d => d.id === applyTargetDocId);
  const actionableSuggestionsForTarget = selectedTargetDoc
    ? dataset.suggestions.filter(s => {
        if (s.status !== 'accepted' && s.status !== 'modified') return false;
        if (s.isOutdated) return false;
        if (s.documentId && s.documentId !== selectedTargetDoc.id) return false;
        const block = selectedTargetDoc.blocks.find(b => b.id === s.targetBlockId);
        if (!block || block.content !== s.originalContent) return false;
        return true;
      })
    : [];

  const staleSuggestionsForTarget = selectedTargetDoc
    ? dataset.suggestions.filter(s => {
        if (s.status !== 'accepted' && s.status !== 'modified') return false;
        if (s.documentId && s.documentId !== selectedTargetDoc.id) return false;
        const block = selectedTargetDoc.blocks.find(b => b.id === s.targetBlockId);
        return s.isOutdated || !block || block.content !== s.originalContent;
      })
    : [];

  return (
    <div className="suggestions-view">
      <header className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Refactoring & Governance Queue</h2>
            <p className="description" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              Evaluate deterministic heuristic recommendations. Unreviewed suggestions are never applied silently.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={handleRunAnalysis}
              title="Run deterministic rules for clarity, alignment, and deduplication"
            >
              ⚡ Run Heuristic Analysis
            </button>

            <button
              ref={applyTriggerRef}
              className="btn btn-primary"
              onClick={handleOpenApplyModal}
              title="Apply accepted and modified suggestions to generate a new document version"
              aria-label="Open dialog to apply approved suggestions to a new version"
            >
              ✨ Apply Approved to New Version
            </button>

            <button
              className={`btn ${showAudit ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setShowAudit(!showAudit)}
            >
              {showAudit ? 'Active Queue' : 'Decision Audit Trail'}
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontSize: '0.85rem'
            }}
          >
            {notification}
          </div>
        )}

        {/* DOCUMENT FILTER SELECTOR */}
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Filter by Document:
            <select
              value={selectedDocFilter}
              onChange={e => setSelectedDocFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <option value="all">All Documents ({dataset.documents.length})</option>
              {dataset.documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.version})
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Showing {pending.length} pending, {reviewed.length} reviewed
          </span>
        </div>
      </header>

      {/* REFACTORING ANALYTICS SUMMARY */}
      <section
        className="analytics-banner"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'var(--color-surface-soft)',
          padding: '1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}
      >
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Decision Flow
          </label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.acceptanceRate.toFixed(1)}% Adopted</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Clarity & Readability
          </label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.clarity} Rules</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Outcome Alignment
          </label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.alignment} Gaps</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Deduplication / Merges
          </label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.structural} Near-Duplicates</div>
        </div>
      </section>

      {/* SUGGESTIONS LIST (QUEUE) OR AUDIT TRAIL */}
      {!showAudit ? (
        <div className="suggestions-list">
          {pending.length > 0 ? (
            pending.map(suggestion => {
              const doc = dataset.documents.find(d => d.id === suggestion.documentId);
              return (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  documentTitle={doc ? `${doc.title} (${doc.version})` : undefined}
                  onAccept={(id, notes) => updateStatus(id, 'accepted', undefined, notes)}
                  onReject={(id, notes) => updateStatus(id, 'rejected', undefined, notes)}
                  onModify={(id, content, notes) => updateStatus(id, 'modified', content, notes)}
                  onUndo={handleUndo}
                />
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>No Pending Suggestions in this Queue</h3>
              <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0.5rem auto 1.5rem' }}>
                All recommendations for this selection have been reviewed, or no analysis has been run yet.
              </p>
              <button className="btn btn-primary" onClick={handleRunAnalysis}>
                Run Heuristic Analysis Now
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="audit-history">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Human Decision Audit Trail</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{reviewed.length} Actioned Decisions</span>
          </div>

          {reviewed.length > 0 ? (
            reviewed
              .slice()
              .sort((a, b) => new Date(b.reviewedAt || 0).getTime() - new Date(a.reviewedAt || 0).getTime())
              .map(s => {
                const doc = dataset.documents.find(d => d.id === s.documentId);
                return (
                  <div
                    key={s.id}
                    className={`audit-row status-${s.status}`}
                    style={{
                      padding: '1.25rem',
                      marginBottom: '1rem',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`suggestion-status status-${s.status}`}>{s.status.toUpperCase()}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {doc ? `${doc.title} (${doc.version})` : 'Curriculum Document'} · Block: <code>{s.targetBlockId}</code>
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginTop: '0.35rem' }}>
                          {s.rationale}
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleUndo(s.id)}
                        title="Revert decision and return to active queue"
                      >
                        ↩ Re-evaluate
                      </button>
                    </div>

                    {s.reviewerNotes && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          background: 'var(--color-surface-dim)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '4px',
                          color: 'var(--secondary)'
                        }}
                      >
                        <strong>Reviewer Rationale:</strong> {s.reviewerNotes}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Actioned on {s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : 'Recent review'}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)' }}>No suggestions have been reviewed yet.</p>
            </div>
          )}
        </div>
      )}

      {/* APPLY REFACTORING CONFIRMATION MODAL */}
      {isApplyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setIsApplyModalOpen(false);
              applyTriggerRef.current?.focus();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            ref={applyModalRef}
            tabIndex={-1}
            style={{
              background: 'white',
              borderRadius: '8px',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div>
              <h3 id="apply-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Apply Approved Changes to New Version
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                A new, versioned curriculum document will be generated. The original document is preserved unchanged.
              </p>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Target Source Document:
              <select
                value={applyTargetDocId}
                onChange={e => {
                  setApplyTargetDocId(e.target.value);
                  const doc = dataset.documents.find(d => d.id === e.target.value);
                  if (doc) setNewVersionName(`${doc.version}.1-refactored`);
                }}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              >
                {dataset.documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} (v{d.version})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
              New Version Identifier:
              <input
                type="text"
                value={newVersionName}
                onChange={e => setNewVersionName(e.target.value)}
                placeholder="e.g. 1.1-refactored"
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
                required
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Reviewer Sign-off Rationale (Audit Record):
              <textarea
                value={applyRationale}
                onChange={e => setApplyRationale(e.target.value)}
                placeholder="e.g. Approved clarity enhancements and aligned Outcome 1 references."
                rows={2}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />
            </label>

            {/* AUDIT SUMMARY OF ACTIONABLE SUGGESTIONS */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: actionableSuggestionsForTarget.length > 0 ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${actionableSuggestionsForTarget.length > 0 ? '#bbf7d0' : '#fef3c7'}`,
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: actionableSuggestionsForTarget.length > 0 ? '#166534' : '#92400e'
              }}
            >
              {actionableSuggestionsForTarget.length > 0 ? (
                <div>
                  ✓ <strong>{actionableSuggestionsForTarget.length} approved change(s)</strong> ready to apply to this document.
                  Unreviewed pending suggestions will be ignored.
                </div>
              ) : (
                <div>
                  ⚠️ <strong>No valid approved suggestions</strong> for this document. You must accept or modify at least one up-to-date suggestion before applying.
                </div>
              )}
            </div>

            {staleSuggestionsForTarget.length > 0 && (
              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#991b1b'
                }}
              >
                ⚠️ <strong>{staleSuggestionsForTarget.length} reviewed suggestion(s) blocked:</strong> Underlying block content has changed since review or is flagged as outdated. Re-evaluation is required in the review queue before these changes can be applied.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  applyTriggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleConfirmApply();
                  applyTriggerRef.current?.focus();
                }}
                disabled={actionableSuggestionsForTarget.length === 0 || !newVersionName.trim()}
              >
                Confirm & Create Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
