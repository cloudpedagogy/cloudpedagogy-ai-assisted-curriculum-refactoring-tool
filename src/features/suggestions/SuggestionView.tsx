import React from 'react';
import type { CombinedDataset } from '../../types';
import { SuggestionCard } from './SuggestionCard';

interface SuggestionViewProps {
  dataset: CombinedDataset;
  onUpdateDataset: (newDataset: CombinedDataset) => void;
}

export const SuggestionView: React.FC<SuggestionViewProps> = ({ dataset, onUpdateDataset }) => {
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
        <h2>Refactoring Suggestions</h2>
        <p className="description">
          Evaluate and decide on AI-assisted curriculum improvements. Human oversight is required for all changes.
        </p>
      </header>

      <div className="suggestions-list">
        {dataset.suggestions.map(suggestion => (
          <SuggestionCard 
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onReject={(id) => updateStatus(id, 'rejected')}
            onModify={(id, content) => updateStatus(id, 'modified', content)}
          />
        ))}
      </div>
    </div>
  );
};
