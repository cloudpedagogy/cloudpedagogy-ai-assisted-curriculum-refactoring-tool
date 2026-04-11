import React, { useState } from 'react';
import type { CombinedDataset } from '../../types';
import { SuggestionCard } from './SuggestionCard';
import { getRefactoringAnalytics } from '../../lib/refactoring';

interface SuggestionViewProps {
  dataset: CombinedDataset;
  onUpdateDataset: (newDataset: CombinedDataset) => void;
}

export const SuggestionView: React.FC<SuggestionViewProps> = ({ dataset, onUpdateDataset }) => {
  const [showAudit, setShowAudit] = useState(false);
  
  const updateStatus = (id: string, status: 'accepted' | 'rejected' | 'modified', modifiedContent?: string) => {
    const updatedSuggestions = dataset.suggestions.map(s => 
      s.id === id ? { 
        ...s, 
        status, 
        modifiedContent: modifiedContent || s.modifiedContent,
        reviewedAt: new Date().toISOString()
      } : s
    );
    
    onUpdateDataset({ ...dataset, suggestions: updatedSuggestions });
  };

  const analytics = getRefactoringAnalytics(dataset.suggestions);
  const pending = dataset.suggestions.filter(s => s.status === 'pending');
  const reviewed = dataset.suggestions.filter(s => s.status !== 'pending');

  if (dataset.suggestions.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Suggestions Available</h2>
        <p>Run an analysis or load sample data to see AI-assisted curriculum improvements.</p>
      </div>
    );
  }

  return (
    <div className="suggestions-view">
      <header className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Refactoring & Governance</h2>
            <p className="description">
              Evaluate AI-assisted curriculum improvements. Human oversight is mandatory.
            </p>
          </div>
          <button 
            className={`btn ${showAudit ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setShowAudit(!showAudit)}
          >
            {showAudit ? 'Show Active Queue' : 'View Audit History'}
          </button>
        </div>
      </header>

      {/* REFACTORING ANALYTICS SUMMARY */}
      <section className="analytics-banner" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1rem', 
        marginBottom: '2rem',
        background: 'var(--bg-secondary)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Decision Flow</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.acceptanceRate.toFixed(1)}% Accept</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Clarity Gains</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.clarity} Blocks</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pedagogical Alignment</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.alignment} Adjustments</div>
        </div>
        <div className="stat-item">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Structural Refinement</label>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.improvementAreas.structural} Merges</div>
        </div>
      </section>

      {!showAudit ? (
        <div className="suggestions-list">
          {pending.length > 0 ? (
            pending.map(suggestion => (
              <SuggestionCard 
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={(id) => updateStatus(id, 'accepted')}
                onReject={(id) => updateStatus(id, 'rejected')}
                onModify={(id, content) => updateStatus(id, 'modified', content)}
              />
            ))
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p>All suggestions have been reviewed. Check the Audit History for results.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="audit-history">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Decision Audit Trail</h3>
          {reviewed.length > 0 ? (
            reviewed.sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime()).map(s => (
              <div key={s.id} className={`audit-row status-${s.status}`} style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.rationale.substring(0, 100)}...</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Actioned on {new Date(s.reviewedAt!).toLocaleString()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`tag-pill status-${s.status}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>{s.status.toUpperCase()}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No suggestions have been reviewed yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

