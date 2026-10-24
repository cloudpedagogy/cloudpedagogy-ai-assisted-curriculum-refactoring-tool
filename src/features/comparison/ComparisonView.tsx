import React, { useState } from 'react';
import type { ContentDocument } from '../../types';
import { compareDocuments, buildAlignedComparisonRows } from '../../lib/processing/comparison';
import { computeWordDiff } from '../../lib/processing/diff';

interface ComparisonViewProps {
  documents: ContentDocument[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ documents }) => {
  const [sourceId, setSourceId] = useState<string>(documents[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(
    documents[1] ? documents[1].id : documents[0]?.id || ''
  );

  if (documents.length < 2) {
    return (
      <div className="comparison-empty" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>Insufficient Curriculum Versions</h3>
        <p style={{ color: 'var(--muted)' }}>
          At least two curriculum document versions are required for comparison.
          Import an additional document or use "Apply Approved to New Version" in the Refactoring tab to create a refactored version.
        </p>
      </div>
    );
  }

  const sourceDoc = documents.find(d => d.id === sourceId) || documents[0];
  const targetDoc = documents.find(d => d.id === targetId) || documents[1] || documents[0];

  const handleSwap = () => {
    setSourceId(targetDoc.id);
    setTargetId(sourceDoc.id);
  };

  const comparison = compareDocuments(sourceDoc, targetDoc);
  const alignedRows = buildAlignedComparisonRows(sourceDoc, targetDoc, comparison);

  const matchedCount = comparison.matchedBlockIds.length;
  const differenceCount = comparison.differences.filter(d => d.type === 'modified').length;
  const removedCount = comparison.differences.filter(d => d.type === 'removed').length;
  const addedCount = comparison.differences.filter(d => d.type === 'added').length;

  const similarityPercent = Math.round(comparison.similarityScore * 100);

  return (
    <div className="comparison-container">
      {/* VERSION PICKER CONTROLS */}
      <div
        className="version-selector-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'white',
          padding: '1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <span>Source Baseline:</span>
            <select
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} (v{d.version})
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleSwap}
          title="Swap source baseline and comparison target"
          aria-label="Swap source baseline and comparison target versions"
          style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}
        >
          ⇄ Swap Versions
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <span>Comparison Target:</span>
            <select
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} (v{d.version})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* COMPARISON METRICS SUMMARY */}
      <div className="comparison-summary-bar">
        <div className="summary-item">
          <span className="label">Matched Sections:</span>
          <span className="value">{matchedCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Modified:</span>
          <span className="value" style={{ color: '#92400e' }}>{differenceCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Removed:</span>
          <span className="value" style={{ color: '#991b1b' }}>{removedCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Added:</span>
          <span className="value" style={{ color: '#166534' }}>{addedCount}</span>
        </div>
        <div className="summary-item similarity">
          <span className="label">Structural Similarity:</span>
          <span className="value" title="Bounded token-level Jaccard similarity across matched blocks">
            {similarityPercent}%
          </span>
        </div>
      </div>

      {/* ALIGNED SIDE-BY-SIDE ROWS WITH WORD DIFF */}
      <div className="aligned-comparison-rows" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          padding: '0.5rem 1rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: 'var(--primary)'
        }}>
          <div>
            Source Baseline: {sourceDoc.title} <span className="version-pill">v{sourceDoc.version}</span>
          </div>
          <div>
            Comparison Target: {targetDoc.title} <span className="version-pill">v{targetDoc.version}</span>
          </div>
        </div>

        {alignedRows.map(row => {
          const isModified = row.status === 'modified';
          const isAdded = row.status === 'added';
          const isRemoved = row.status === 'removed';

          let wordDiff = null;
          if (isModified && row.sourceBlock && row.targetBlock) {
            wordDiff = computeWordDiff(row.sourceBlock.content, row.targetBlock.content);
          }

          return (
            <div
              key={row.id}
              className={`comparison-row status-${row.status}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isModified
                  ? '#fffdf5'
                  : isAdded
                    ? '#f0fdf4'
                    : isRemoved
                      ? '#fef2f2'
                      : 'white',
                position: 'relative'
              }}
            >
              {/* STATUS BADGE */}
              <div
                style={{
                  position: 'absolute',
                  top: '-9px',
                  right: '16px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  color: isModified
                    ? '#92400e'
                    : isAdded
                      ? '#166534'
                      : isRemoved
                        ? '#991b1b'
                        : '#475569'
                }}
              >
                {row.status === 'modified' ? '✎ Modified' :
                 row.status === 'added' ? '+ Added' :
                 row.status === 'removed' ? '- Removed' : '= Matched'}
                {row.similarity !== undefined && row.status === 'modified' && (
                  <span> ({Math.round(row.similarity * 100)}% match)</span>
                )}
              </div>

              {/* LEFT COLUMN: SOURCE BLOCK */}
              <div className="source-cell">
                {row.sourceBlock ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                      Block: <code>{row.sourceBlock.id}</code> ({row.sourceBlock.type})
                    </div>
                    {row.sourceBlock.type === 'heading' ? (
                      <h4 style={{ margin: 0 }}>{row.sourceBlock.content}</h4>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: isRemoved ? '#991b1b' : 'inherit' }}>
                        {row.sourceBlock.content}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    — [No corresponding content in source version] —
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: TARGET BLOCK */}
              <div className="target-cell">
                {row.targetBlock ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                      Block: <code>{row.targetBlock.id}</code> ({row.targetBlock.type})
                    </div>
                    {isModified && wordDiff ? (
                      <div>
                        {row.targetBlock.type === 'heading' ? (
                          <h4 style={{ margin: 0 }}>
                            {wordDiff.map((chunk, idx) => (
                              chunk.type === 'added' ? (
                                <ins key={idx} aria-label={`Added: ${chunk.text}`} style={{ background: '#dcfce7', color: '#166534', textDecoration: 'underline', textUnderlineOffset: '2px', padding: '1px 3px' }}>
                                  <span className="sr-only">[Added: ]</span>{chunk.text}
                                </ins>
                              ) : chunk.type === 'removed' ? (
                                <del key={idx} aria-label={`Removed: ${chunk.text}`} style={{ background: '#fee2e2', color: '#991b1b', textDecoration: 'line-through', padding: '1px 3px' }}>
                                  <span className="sr-only">[Removed: ]</span>{chunk.text}
                                </del>
                              ) : (
                                <span key={idx}>{chunk.text}</span>
                              )
                            ))}
                          </h4>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                            {wordDiff.map((chunk, idx) => (
                              chunk.type === 'added' ? (
                                <ins key={idx} aria-label={`Added: ${chunk.text}`} style={{ background: '#dcfce7', color: '#166534', textDecoration: 'underline', textUnderlineOffset: '2px', padding: '1px 3px', borderRadius: '3px' }}>
                                  <span className="sr-only">[Added: ]</span>{chunk.text}
                                </ins>
                              ) : chunk.type === 'removed' ? (
                                <del key={idx} aria-label={`Removed: ${chunk.text}`} style={{ background: '#fee2e2', color: '#991b1b', textDecoration: 'line-through', padding: '1px 3px', borderRadius: '3px' }}>
                                  <span className="sr-only">[Removed: ]</span>{chunk.text}
                                </del>
                              ) : (
                                <span key={idx}>{chunk.text}</span>
                              )
                            ))}
                          </p>
                        )}
                      </div>
                    ) : row.targetBlock.type === 'heading' ? (
                      <h4 style={{ margin: 0 }}>{row.targetBlock.content}</h4>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: isAdded ? '#166534' : 'inherit' }}>
                        {row.targetBlock.content}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#dc2626', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    — [Block removed in comparison target] —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
