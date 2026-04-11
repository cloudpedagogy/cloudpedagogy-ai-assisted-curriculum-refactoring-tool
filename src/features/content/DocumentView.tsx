import React from 'react';
import type { ContentDocument, CombinedDataset } from '../../types';
import { checkOutcomeAlignment, detectConsistencyIssues } from '../../lib/refactoring';

interface DocumentViewProps {
  document: ContentDocument | null;
  dataset: CombinedDataset;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ document, dataset }) => {
  if (!document) {
    return (
      <div className="document-empty">
        <p>No version selected. Please choose a curriculum version to view details.</p>
      </div>
    );
  }

  const allBlocks = dataset.documents.flatMap(doc => doc.blocks);
  const consistencyIssues = detectConsistencyIssues(allBlocks);

  return (
    <div className="document-detail">
      <div className="doc-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0 }}>{document.title}</h2>
            <span className="doc-version-tag">Version: {document.version}</span>
          </div>
        </div>
      </div>
      
      <div className="block-list">
        {document.blocks.map((block) => {
          const alignmentIssues = checkOutcomeAlignment(block, dataset.learningOutcomes);
          const blockConsistency = consistencyIssues.filter((ci) => ci.blockId === block.id);
          
          return (
            <div key={block.id} className={`content-block block-type-${block.type}`} style={{ position: 'relative' }}>
              {/* CONSISTENCY WARNINGS */}
              {blockConsistency.length > 0 && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '3px', 
                  marginBottom: '0.5rem',
                  background: blockConsistency[0].type === 'Exact Duplicate' ? '#fee2e2' : '#fef3c7',
                  color: blockConsistency[0].type === 'Exact Duplicate' ? '#991b1b' : '#92400e',
                  border: `1px solid ${blockConsistency[0].type === 'Exact Duplicate' ? '#ef4444' : '#f59e0b'}`,
                  fontWeight: 700
                }}>
                  {blockConsistency[0].type.toUpperCase()}: This content matches another block in the registry.
                </div>
              )}

              {/* ALIGNMENT WARNINGS */}
              {alignmentIssues.map((issue, i) => (
                <div key={i} style={{ 
                  fontSize: '0.7rem', 
                  color: '#92400e', 
                  background: '#fffbeb', 
                  padding: '0.25rem 0.5rem', 
                  borderLeft: '3px solid #f59e0b',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  {issue}
                </div>
              ))}

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
          );
        })}
      </div>
    </div>
  );
};

