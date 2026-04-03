import React from 'react';
import type { ContentDocument, ComparisonResult } from '../../types';
import { compareDocuments } from '../../lib/processing/comparison';

interface ComparisonViewProps {
  documents: ContentDocument[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ documents }) => {
  if (documents.length < 2) {
    return (
      <div className="comparison-empty">
        <p>Please select at least two versions to compare.</p>
      </div>
    );
  }

  // Pairwise comparison between Doc 1 and Doc 2 for now
  const doc1 = documents[0];
  const doc2 = documents[1];
  const comparison: ComparisonResult = compareDocuments(doc1, doc2);

  const matchedCount = comparison.matchedBlockIds.length;
  const differenceCount = comparison.differences.filter(d => d.type === 'modified').length;
  const missingCount = comparison.differences.filter(d => d.type === 'removed' || d.type === 'added').length;

  return (
    <div className="comparison-container">
      <div className="comparison-summary-bar">
        <div className="summary-item">
          <span className="label">Matched Sections:</span>
          <span className="value success">{matchedCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Differences:</span>
          <span className="value warning">{differenceCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Missing/New Sections:</span>
          <span className="value danger">{missingCount}</span>
        </div>
        <div className="summary-item similarity">
          <span className="label">Similarity Score:</span>
          <span className="value">{Math.round(comparison.similarityScore * 100)}%</span>
        </div>
      </div>

      <div className="comparison-grid">
        {/* Source Column */}
        <div className="comparison-column">
          <h3>{doc1.title} <span className="version-pill">{doc1.version}</span></h3>
          <div className="block-list">
            {doc1.blocks.map(block => {
              const diff = comparison.differences.find(d => d.sourceBlockId === block.id);
              const isMatched = comparison.matchedBlockIds.some(m => m[0] === block.id);
              const statusClass = isMatched ? (diff?.type === 'modified' ? 'modified' : 'matched') : 'removed';

              return (
                <div key={block.id} className={`comparison-block ${statusClass}`}>
                  <div className="block-label">{statusClass}</div>
                  {block.type === 'heading' ? <h4>{block.content}</h4> : <p>{block.content}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Column */}
        <div className="comparison-column">
          <h3>{doc2.title} <span className="version-pill">{doc2.version}</span></h3>
          <div className="block-list">
            {doc2.blocks.map(block => {
              const diff = comparison.differences.find(d => d.targetBlockId === block.id);
              const isMatched = comparison.matchedBlockIds.some(m => m[1] === block.id);
              const statusClass = isMatched ? (diff?.type === 'modified' ? 'modified' : 'matched') : 'added';

              return (
                <div key={block.id} className={`comparison-block ${statusClass}`}>
                  <div className="block-label">{statusClass}</div>
                  {block.type === 'heading' ? <h4>{block.content}</h4> : <p>{block.content}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
