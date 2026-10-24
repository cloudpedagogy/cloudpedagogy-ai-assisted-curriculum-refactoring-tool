import React, { useState } from 'react';
import type { RefactoringSuggestion } from '../../types';
import { computeWordDiff } from '../../lib/refactoring';

interface SuggestionCardProps {
  suggestion: RefactoringSuggestion;
  documentTitle?: string;
  onAccept: (id: string, notes?: string) => void;
  onModify: (id: string, newContent: string, notes?: string) => void;
  onReject: (id: string, notes?: string) => void;
  onUndo: (id: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  documentTitle,
  onAccept,
  onModify,
  onReject,
  onUndo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    suggestion.status === 'modified' && suggestion.modifiedContent
      ? suggestion.modifiedContent
      : suggestion.suggestedContent
  );
  const [reviewerNotes, setReviewerNotes] = useState(suggestion.reviewerNotes || '');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'inline'>('split');

  const effectiveRevisedContent =
    suggestion.status === 'modified' && suggestion.modifiedContent
      ? suggestion.modifiedContent
      : suggestion.suggestedContent;

  const handleModifyClick = () => {
    setIsEditing(true);
    setShowNotesInput(true);
  };

  const handleSaveModification = () => {
    onModify(suggestion.id, editedContent, reviewerNotes.trim() || undefined);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(effectiveRevisedContent);
    setIsEditing(false);
  };

  const handleAcceptClick = () => {
    onAccept(suggestion.id, reviewerNotes.trim() || undefined);
  };

  const handleRejectClick = () => {
    onReject(suggestion.id, reviewerNotes.trim() || undefined);
  };

  const diffChunks = computeWordDiff(suggestion.originalContent, effectiveRevisedContent);

  // Map suggestion types to human-readable heuristic category badges
  const typeLabels: Record<string, string> = {
    clarity: 'Clarity & Readability',
    gap: 'Outcome Alignment Gap',
    update: 'Alignment Update',
    merge: 'Deduplication / Redundancy',
    sequence: 'Instructional Sequence'
  };

  return (
    <div className={`suggestion-card status-${suggestion.status}`}>
      {/* HEADER WITH PROVENANCE AND HEURISTIC BADGES */}
      <div className="suggestion-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="ai-label" style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            Heuristic Rule: {typeLabels[suggestion.type] || suggestion.type.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--color-surface-dim)', padding: '2px 6px', borderRadius: '4px' }}>
            {documentTitle ? `${documentTitle} · ` : ''}Block: <code>{suggestion.targetBlockId}</code>
          </span>
        </div>
        <span className={`suggestion-status status-${suggestion.status}`}>
          {suggestion.status}
        </span>
      </div>

      {suggestion.isOutdated && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '0.6rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.82rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            ⚠️ <strong>Re-evaluation Required:</strong> {suggestion.outdatedReason || 'Underlying block content has changed since this review was recorded.'}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'white', color: '#991b1b', borderColor: '#fca5a5' }}
            onClick={() => onUndo(suggestion.id)}
          >
            Re-evaluate Now
          </button>
        </div>
      )}

      {/* RATIONALE & HEURISTIC EVIDENCE */}
      <div className="suggestion-rationale">
        <strong>Rationale & Diagnostic Evidence:</strong> {suggestion.rationale}
      </div>

      {/* VIEW TOGGLE (SIDE-BY-SIDE VS INLINE WORD DIFF) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <div style={{ display: 'inline-flex', background: 'var(--color-surface-dim)', padding: '2px', borderRadius: '6px', fontSize: '0.75rem' }}>
          <button
            type="button"
            className={`btn-sm ${diffViewMode === 'split' ? 'btn-secondary' : 'btn-outline'}`}
            style={{ border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setDiffViewMode('split')}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            className={`btn-sm ${diffViewMode === 'inline' ? 'btn-secondary' : 'btn-outline'}`}
            style={{ border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setDiffViewMode('inline')}
          >
            Inline Word Diff
          </button>
        </div>
      </div>

      {/* COMPARISON VIEW CONTENT */}
      {diffViewMode === 'inline' && !isEditing ? (
        <div className="inline-diff-box" style={{
          padding: '1.25rem',
          background: 'var(--color-surface-soft)',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          marginBottom: '1.5rem'
        }}>
          {diffChunks.map((chunk, idx) => {
            if (chunk.type === 'added') {
              return (
                <ins
                  key={idx}
                  style={{
                    background: '#dcfce7',
                    color: '#166534',
                    textDecoration: 'none',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontWeight: 600
                  }}
                >
                  {chunk.text}
                </ins>
              );
            }
            if (chunk.type === 'removed') {
              return (
                <del
                  key={idx}
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    textDecoration: 'line-through',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
                >
                  {chunk.text}
                </del>
              );
            }
            return <span key={idx}>{chunk.text}</span>;
          })}
        </div>
      ) : (
        <div className="suggestion-content">
          <div className="suggestion-box">
            <h4>Original Content</h4>
            <p>{suggestion.originalContent}</p>
          </div>

          <div className="suggestion-box">
            <h4>{suggestion.status === 'modified' ? 'Educator-Modified Revision' : 'Suggested Revision'}</h4>
            {isEditing ? (
              <div className="suggestion-editor">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Enter customized curriculum text..."
                  rows={4}
                />
              </div>
            ) : (
              <p>{effectiveRevisedContent}</p>
            )}
          </div>
        </div>
      )}

      {/* REVIEWER RATIONALE / NOTES (SUBSTANTIVE GOVERNANCE AUDIT) */}
      {(showNotesInput || isEditing || suggestion.reviewerNotes) && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'var(--color-surface-soft)',
          border: '1px solid var(--border)',
          borderRadius: '6px'
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Reviewer Notes & Decision Rationale:</span>
            {isEditing || suggestion.status === 'pending' ? (
              <input
                type="text"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="State educational justification for this change or approval..."
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
            ) : (
              <span style={{ fontWeight: 400, color: 'var(--secondary)' }}>
                {suggestion.reviewerNotes || 'No substantive rationale recorded.'}
              </span>
            )}
          </label>
        </div>
      )}

      {/* ACTIONS */}
      {isEditing ? (
        <div className="decision-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSaveModification}>
            Save as Modified
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      ) : suggestion.status === 'pending' ? (
        <div className="decision-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleAcceptClick}>
              Accept
            </button>
            <button className="btn btn-outline" onClick={handleModifyClick}>
              Modify
            </button>
            <button className="btn btn-danger" onClick={handleRejectClick}>
              Reject
            </button>
          </div>
          {!showNotesInput && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() => setShowNotesInput(true)}
            >
              + Add Reviewer Note
            </button>
          )}
        </div>
      ) : (
        <div className="decision-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
              Decision: <strong>{suggestion.status.toUpperCase()}</strong>
            </span>
            {suggestion.reviewedAt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                ({new Date(suggestion.reviewedAt).toLocaleDateString()})
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onUndo(suggestion.id)}
            aria-label="Undo and re-evaluate this recommendation decision"
            style={{ fontWeight: 600 }}
          >
            ↩ Undo / Re-evaluate
          </button>
        </div>
      )}
    </div>
  );
};
