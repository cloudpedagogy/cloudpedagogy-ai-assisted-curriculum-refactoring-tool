import type { CombinedDataset, ContentDocument } from '../../types';

/**
 * Formats a single ContentDocument into clean, academic Markdown.
 */
export function formatDocumentMarkdown(doc: ContentDocument, outcomes: CombinedDataset['learningOutcomes']): string {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  lines.push('');
  lines.push(`- **Version:** ${doc.version}`);
  if (doc.author) lines.push(`- **Author / Board:** ${doc.author}`);
  lines.push(`- **Exported:** ${new Date().toLocaleDateString('en-GB')}`);
  lines.push('');

  if (outcomes.length > 0) {
    lines.push('## Course Learning Outcomes');
    lines.push('');
    outcomes.forEach((lo, i) => {
      const levelLabel = lo.level.charAt(0).toUpperCase() + lo.level.slice(1);
      lines.push(`${i + 1}. **[${levelLabel}]** ${lo.statement}`);
    });
    lines.push('');
  }

  lines.push('## Curriculum Content');
  lines.push('');

  doc.blocks.forEach(block => {
    switch (block.type) {
      case 'heading':
        lines.push(`### ${block.content}`);
        lines.push('');
        break;
      case 'paragraph':
        lines.push(block.content);
        if (block.tags && block.tags.length > 0) {
          lines.push('');
          lines.push(`*Tags: ${block.tags.map(t => `\`${t}\``).join(', ')}*`);
        }
        lines.push('');
        break;
      case 'list':
        // If content is already bulleted or multiline
        block.content.split('\n').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) {
            lines.push(trimmed.startsWith('-') || trimmed.startsWith('*') ? trimmed : `- ${trimmed}`);
          }
        });
        lines.push('');
        break;
      default:
        lines.push(`> [!NOTE]`);
        lines.push(`> **${block.type.toUpperCase()}:** ${block.content}`);
        lines.push('');
        break;
    }
  });

  return lines.join('\n');
}

/**
 * Exports curriculum content as Markdown.
 * If selectedDocId is provided, exports that document; otherwise exports all documents separated by dividers.
 */
export function exportCurriculumAsMarkdown(dataset: CombinedDataset, selectedDocId?: string): string {
  if (dataset.documents.length === 0) {
    return '# Curriculum Export\n\nNo curriculum documents available in dataset.\n';
  }

  const docsToExport = selectedDocId
    ? dataset.documents.filter(d => d.id === selectedDocId)
    : dataset.documents;

  const targetDocs = docsToExport.length > 0 ? docsToExport : dataset.documents;

  const sections = targetDocs.map(doc => formatDocumentMarkdown(doc, dataset.learningOutcomes));
  return sections.join('\n\n---\n\n');
}
