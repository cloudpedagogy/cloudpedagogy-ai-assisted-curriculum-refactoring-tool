import React, { useState } from 'react';
import type { CombinedDataset, LearningOutcome } from '../../types';
import { analyzeBloomVerb, BLOOM_DOMAINS, type CognitiveDomain } from '../../lib/refactoring';

interface OutcomeManagerProps {
  dataset: CombinedDataset;
  onUpdateDataset: (newDataset: CombinedDataset) => void;
}

const DECLARED_LEVELS: LearningOutcome['level'][] = [
  'knowledge',
  'comprehension',
  'application',
  'analysis',
  'synthesis',
  'evaluation'
];

export const OutcomeManager: React.FC<OutcomeManagerProps> = ({ dataset, onUpdateDataset }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatement, setEditStatement] = useState('');
  const [editLevel, setEditLevel] = useState<LearningOutcome['level']>('comprehension');

  // New Outcome Form State
  const [newStatement, setNewStatement] = useState('');
  const [newLevel, setNewLevel] = useState<LearningOutcome['level']>('application');
  const [isAdding, setIsAdding] = useState(false);

  // Live Bloom's analysis for the new outcome input
  const newOutcomeAnalysis = newStatement.trim()
    ? analyzeBloomVerb(newStatement, newLevel)
    : null;

  const handleStartEdit = (lo: LearningOutcome) => {
    setEditingId(lo.id);
    setEditStatement(lo.statement);
    setEditLevel(lo.level);
  };

  const handleSaveEdit = (id: string) => {
    if (!editStatement.trim()) return;
    const updated = dataset.learningOutcomes.map(lo =>
      lo.id === id ? { ...lo, statement: editStatement.trim(), level: editLevel } : lo
    );
    onUpdateDataset({ ...dataset, learningOutcomes: updated });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(`Are you sure you want to remove learning outcome "${id}"?`)) return;
    const updated = dataset.learningOutcomes.filter(lo => lo.id !== id);
    onUpdateDataset({ ...dataset, learningOutcomes: updated });
  };

  const handleAddOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;

    // Generate unique ID
    const nextNum = dataset.learningOutcomes.length + 1;
    const id = `lo-${nextNum}-${Date.now().toString(36).slice(-4)}`;

    const newOutcome: LearningOutcome = {
      id,
      statement: newStatement.trim(),
      level: newLevel
    };

    onUpdateDataset({
      ...dataset,
      learningOutcomes: [...dataset.learningOutcomes, newOutcome]
    });

    setNewStatement('');
    setNewLevel('application');
    setIsAdding(false);
  };

  const formatDomainLabel = (domain: CognitiveDomain): string => {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  };

  return (
    <div className="outcomes-manager" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Learning Outcomes & Cognitive Design</h2>
            <p className="description" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Manage curriculum learning goals and inspect cognitive indicators. User-defined pedagogical intent is strictly preserved.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsAdding(!isAdding)}
            aria-expanded={isAdding}
          >
            {isAdding ? 'Close Form' : '+ Add Learning Outcome'}
          </button>
        </div>

        <div className="disclaimer" style={{ marginTop: '1rem', borderLeft: '3px solid #3b82f6' }}>
          <strong>Pedagogical Heuristic Notice:</strong> Bloom's Taxonomy indicators are deterministic diagnostic aids designed to highlight measurable action verbs. They are advisory heuristics and do not constitute autonomous judgements of educational quality.
        </div>
      </header>

      {/* ADD LEARNING OUTCOME FORM */}
      {isAdding && (
        <section
          className="add-outcome-card"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Add Learning Outcome</h3>
          <form onSubmit={handleAddOutcome} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Outcome Statement (Objective)</span>
              <textarea
                value={newStatement}
                onChange={e => setNewStatement(e.target.value)}
                placeholder="e.g. Design and evaluate secure cloud architecture components adhering to zero-trust principles."
                rows={3}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem'
                }}
                required
              />
            </label>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Declared Cognitive Level</span>
                <select
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value as LearningOutcome['level'])}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  {DECLARED_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              {/* LIVE BLOOM'S FEEDBACK BADGE */}
              {newOutcomeAnalysis && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  style={{ marginTop: '1.25rem', flex: 1 }}
                >
                  {newOutcomeAnalysis.isVague ? (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      color: '#92400e',
                      fontSize: '0.8rem'
                    }}>
                      ⚠️ <strong>Vague Verb:</strong> "{newOutcomeAnalysis.detectedVerb}" may be difficult to measure.
                      {newOutcomeAnalysis.suggestedAlternatives.length > 0 && (
                        <span> Consider: {newOutcomeAnalysis.suggestedAlternatives.map(a => `"${a}"`).join(', ')}.</span>
                      )}
                    </div>
                  ) : newOutcomeAnalysis.inferredLevel ? (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      color: '#166534',
                      fontSize: '0.8rem'
                    }}>
                      ✓ <strong>Action Verb:</strong> "{newOutcomeAnalysis.detectedVerb}" corresponds to Bloom's{' '}
                      <strong>{formatDomainLabel(newOutcomeAnalysis.inferredLevel)}</strong> (Level{' '}
                      {BLOOM_DOMAINS[newOutcomeAnalysis.inferredLevel].levelNumber}).
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={!newStatement.trim()}>
                Save Learning Outcome
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* OUTCOMES LIST */}
      <section className="outcomes-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {dataset.learningOutcomes.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <p>No learning outcomes defined in this curriculum dataset.</p>
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add First Learning Outcome
            </button>
          </div>
        ) : (
          dataset.learningOutcomes.map((lo, idx) => {
            const isEditing = editingId === lo.id;
            const analysis = analyzeBloomVerb(lo.statement, lo.level);

            return (
              <div
                key={lo.id}
                className="outcome-card"
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'var(--color-surface-dim)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--secondary)'
                    }}>
                      {lo.id || `LO-${idx + 1}`}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Declared: {lo.level}
                    </span>
                  </div>

                  {!isEditing && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStartEdit(lo)}
                        aria-label={`Edit learning outcome ${lo.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(lo.id)}
                        aria-label={`Delete learning outcome ${lo.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <textarea
                      value={editStatement}
                      onChange={e => setEditStatement(e.target.value)}
                      rows={3}
                      aria-label={`Edit statement for ${lo.id}`}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Cognitive Level:
                        <select
                          value={editLevel}
                          onChange={e => setEditLevel(e.target.value as LearningOutcome['level'])}
                          aria-label={`Select cognitive level for ${lo.id}`}
                          style={{
                            padding: '0.35rem 0.6rem',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {DECLARED_LEVELS.map(level => (
                            <option key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveEdit(lo.id)}
                        aria-label={`Save edited statement for ${lo.id}`}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={handleCancelEdit}
                        aria-label={`Cancel editing statement for ${lo.id}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
                      {lo.statement}
                    </p>
                  </div>
                )}

                {/* HEURISTIC INDICATOR BANNER */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: analysis.isVague
                    ? '#fffbeb'
                    : analysis.inferredLevel
                      ? '#f8fafc'
                      : 'var(--color-surface-soft)',
                  border: `1px solid ${
                    analysis.isVague
                      ? '#fef3c7'
                      : analysis.inferredLevel
                        ? '#e2e8f0'
                        : 'var(--border)'
                  }`,
                  color: analysis.isVague ? '#92400e' : 'var(--secondary)'
                }}>
                  {analysis.isVague ? (
                    <div>
                      ⚠️ <strong>Vague Verb Indicator:</strong> Verb "{analysis.detectedVerb}" may be non-measurable.
                      {analysis.suggestedAlternatives.length > 0 && (
                        <span> Suggested measurable alternatives: {analysis.suggestedAlternatives.map(a => `"${a}"`).join(', ')}.</span>
                      )}
                    </div>
                  ) : analysis.inferredLevel ? (
                    <div>
                      🎯 <strong>Bloom's Heuristic:</strong> Measurable verb "{analysis.detectedVerb}" indicates{' '}
                      <strong>{formatDomainLabel(analysis.inferredLevel)}</strong> (Level{' '}
                      {BLOOM_DOMAINS[analysis.inferredLevel].levelNumber}).
                      {!analysis.levelMatch && (
                        <span style={{ color: '#d97706', marginLeft: '0.5rem' }}>
                          (Note: differs from declared level "{lo.level}")
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>ℹ️ No recognised Revised Bloom's action verb detected at statement start.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
