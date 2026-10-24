import {
  CURRENT_SCHEMA_VERSION,
  type CombinedDataset,
  type HumanDecisionRecord
} from '../../types';
import { getRefactoringAnalytics } from '../refactoring';

/**
 * Builds a structured Human-AI Decision Record from a CombinedDataset.
 */
export function buildDecisionRecord(dataset: CombinedDataset): HumanDecisionRecord {
  const analytics = getRefactoringAnalytics(dataset.suggestions);
  const docMap = new Map(dataset.documents.map(d => [d.id, d.title]));

  const decisions = dataset.suggestions.map(s => {
    let effectiveContent = s.originalContent;
    if (s.status === 'accepted') {
      effectiveContent = s.suggestedContent;
    } else if (s.status === 'modified') {
      effectiveContent = s.modifiedContent || s.suggestedContent;
    }

    return {
      suggestionId: s.id,
      documentId: s.documentId,
      documentTitle: s.documentId ? docMap.get(s.documentId) : undefined,
      targetBlockId: s.targetBlockId,
      type: s.type,
      status: s.status,
      originalContent: s.originalContent,
      effectiveContent,
      rationale: s.rationale,
      reviewedAt: s.reviewedAt,
      reviewerNotes: s.reviewerNotes
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    governance: {
      aiInvolvement: dataset.aiInvolvement || 'None declared',
      assumptions: dataset.assumptions || 'None declared',
      risks: dataset.risks || 'None declared',
      rationale: dataset.rationale || 'None declared',
      reviewNotes: dataset.reviewNotes || 'None declared'
    },
    metrics: {
      totalSuggestions: analytics.total,
      pendingCount: analytics.pending,
      acceptedCount: analytics.accepted,
      modifiedCount: analytics.modified,
      rejectedCount: analytics.rejected,
      acceptanceRatePercent: Math.round(analytics.acceptanceRate * 10) / 10
    },
    decisions
  };
}

/**
 * Serializes the decision record as formatted JSON.
 */
export function exportDecisionRecordAsJson(dataset: CombinedDataset): string {
  const record = buildDecisionRecord(dataset);
  return JSON.stringify(record, null, 2);
}

/**
 * Formats the Human-AI Decision Record into a formal Markdown audit report.
 */
export function exportDecisionRecordAsMarkdown(dataset: CombinedDataset): string {
  const record = buildDecisionRecord(dataset);
  const lines: string[] = [];

  lines.push('# Human–AI Curriculum Decision Record');
  lines.push('');
  lines.push(`- **Record Date:** ${new Date(record.generatedAt).toUTCString()}`);
  lines.push(`- **Schema Version:** ${record.schemaVersion}`);
  lines.push(`- **Total Curriculum Documents:** ${dataset.documents.length}`);
  lines.push('');

  lines.push('## 1. Executive Summary & Review Metrics');
  lines.push('');
  lines.push('| Metric | Value | Description |');
  lines.push('| :--- | :--- | :--- |');
  lines.push(`| **Total Suggestions Evaluated** | ${record.metrics.totalSuggestions} | Total candidate improvements generated |`);
  lines.push(`| **Directly Accepted** | ${record.metrics.acceptedCount} | Accepted as proposed by AI/heuristic |`);
  lines.push(`| **Modified with Oversight** | ${record.metrics.modifiedCount} | Tailored with educator adjustments |`);
  lines.push(`| **Rejected** | ${record.metrics.rejectedCount} | Declined by academic lead |`);
  lines.push(`| **Pending Review** | ${record.metrics.pendingCount} | Awaiting human verification |`);
  lines.push(`| **Adoption Rate** | ${record.metrics.acceptanceRatePercent}% | Combined Accepted + Modified proportion |`);
  lines.push('');

  lines.push('## 2. Institutional Capability & Governance Declaration');
  lines.push('');
  lines.push(`- **Declared AI Involvement:** ${record.governance.aiInvolvement}`);
  lines.push(`- **Pedagogical Assumptions:** ${record.governance.assumptions}`);
  lines.push(`- **Identified Risks or Concerns:** ${record.governance.risks}`);
  lines.push(`- **Refactoring Rationale:** ${record.governance.rationale}`);
  lines.push(`- **Lead Reviewer Notes & Sign-Off:** ${record.governance.reviewNotes}`);
  lines.push('');

  lines.push('## 3. Itemised Refactoring Decision Audit');
  lines.push('');

  if (record.decisions.length === 0) {
    lines.push('*No refactoring suggestions recorded.*');
  } else {
    record.decisions.forEach((d, idx) => {
      lines.push(`### Decision #${idx + 1} [${d.status.toUpperCase()}] — Suggestion \`${d.suggestionId}\``);
      lines.push('');
      if (d.documentTitle) lines.push(`- **Target Document:** ${d.documentTitle} (\`${d.documentId}\`)`);
      lines.push(`- **Target Block ID:** \`${d.targetBlockId}\``);
      lines.push(`- **Refactoring Category:** \`${d.type}\``);
      if (d.reviewedAt) lines.push(`- **Reviewed At:** ${new Date(d.reviewedAt).toLocaleString('en-GB')}`);
      if (d.reviewerNotes) lines.push(`- **Reviewer Justification:** *${d.reviewerNotes}*`);
      lines.push('');
      lines.push(`**AI Rationale:**`);
      lines.push(`> ${d.rationale}`);
      lines.push('');
      lines.push('**Original Content:**');
      lines.push('```');
      lines.push(d.originalContent);
      lines.push('```');
      lines.push('');
      lines.push(`**Final Adopted Content (${d.status}):**`);
      lines.push('```');
      lines.push(d.effectiveContent);
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  lines.push('*This audit trail conforms to the CloudPedagogy Human-in-the-Loop Governance Standard.*');
  return lines.join('\n');
}
