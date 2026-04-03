import React, { useState } from 'react';
import type { RefactoringSuggestion } from '../../types';

interface SuggestionCardProps {
  suggestion: RefactoringSuggestion;
  onAccept: (id: string) => void;
  onModify: (id: string, newContent: string) => void;
  onReject: (id: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  suggestion, onAccept, onModify, onReject 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.suggestedContent);

  const handleModifyClick = () => setIsEditing(true);
  
  const handleSaveModification = () => {
    onModify(suggestion.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(suggestion.suggestedContent);
    setIsEditing(false);
  };

  return (
    <div className={`suggestion-card status-${suggestion.status}`}>
      <div className="suggestion-header">
        <span className="ai-label">✨ AI-assisted suggestion</span>
        <span className={`suggestion-status status-${suggestion.status}`}>
          {suggestion.status}
        </span>
      </div>

      <div className="suggestion-rationale">
        {suggestion.rationale}
      </div>

      <div className="suggestion-content">
        <div className="suggestion-box">
          <h4>Original Content</h4>
          <p>{suggestion.originalContent}</p>
        </div>
        
        <div className="suggestion-box">
          <h4>Suggested Revision</h4>
          {isEditing ? (
            <div className="suggestion-editor">
              <textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="action-buttons">
                <button className="btn btn-primary btn-sm" onClick={handleSaveModification}>Save as Modified</button>
                <button className="btn btn-outline btn-sm" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <p>{suggestion.status === 'modified' ? suggestion.modifiedContent : suggestion.suggestedContent}</p>
          )}
        </div>
      </div>

      {!isEditing && suggestion.status === 'pending' && (
        <div className="decision-actions">
          <button className="btn btn-primary" onClick={() => onAccept(suggestion.id)}>Accept</button>
          <button className="btn btn-outline" onClick={handleModifyClick}>Modify</button>
          <button className="btn btn-danger" onClick={() => onReject(suggestion.id)}>Reject</button>
        </div>
      )}

      {suggestion.status !== 'pending' && (
        <div className="decision-actions">
          <button className="btn btn-outline btn-sm" onClick={() => {/* Future: Undo logic */}} disabled>
            Action Taken: {suggestion.status.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
};
