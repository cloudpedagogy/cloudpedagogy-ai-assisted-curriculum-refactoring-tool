import React from 'react';
import type { ContentDocument } from '../../types';

interface DocumentViewProps {
  document: ContentDocument | null;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ document }) => {
  if (!document) {
    return (
      <div className="document-empty">
        <p>No version selected. Please choose a curriculum version to view details.</p>
      </div>
    );
  }

  return (
    <div className="document-detail">
      <div className="doc-header">
        <h2>{document.title}</h2>
        <span className="doc-version-tag">Version: {document.version}</span>
      </div>
      <div className="block-list">
        {document.blocks.map((block) => (
          <div key={block.id} className={`content-block block-type-${block.type}`}>
            {block.type === 'heading' ? (
              <h4 className="block-heading">{block.content}</h4>
            ) : (
              <p className="block-text">{block.content}</p>
            )}
            {block.tags && block.tags.length > 0 && (
              <div className="block-tags">
                {block.tags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
