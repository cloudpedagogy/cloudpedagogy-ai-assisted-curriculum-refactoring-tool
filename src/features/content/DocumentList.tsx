import React from 'react';
import type { ContentDocument } from '../../types';

interface DocumentListProps {
  documents: ContentDocument[];
  selectedDocId: string | null;
  onSelect: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, selectedDocId, onSelect }) => {
  return (
    <div className="document-list">
      <h3>Course Versions</h3>
      <div className="version-grid">
        {documents.map((doc) => (
          <button
            key={doc.id}
            className={`version-item ${selectedDocId === doc.id ? 'active' : ''}`}
            onClick={() => onSelect(doc.id)}
            aria-label={`Select version: ${doc.title} (${doc.version})`}
            aria-current={selectedDocId === doc.id ? 'true' : undefined}
          >
            <div className="version-info">
              <span className="version-tag">{doc.version}</span>
              <span className="version-title">{doc.title}</span>
            </div>
            <div className="version-author">{doc.author}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
