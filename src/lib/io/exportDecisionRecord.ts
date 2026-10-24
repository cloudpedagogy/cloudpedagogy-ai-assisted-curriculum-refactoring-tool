import {
  CURRENT_SCHEMA_VERSION,
  type CombinedDataset,
  type HumanDecisionRecord
} from '../../types';
import { getRefactoringAnalytics } from '../refactoring';

export const INSTITUTIONAL_DISCLAIMER =
  'This report records deterministic, rule-assisted diagnostic indicators and academic reviewer decisions. ' +
  'Heuristic findings are diagnostic indicators designed to assist academic judgment and must NOT be interpreted as ' +
  'verified educational deficiencies or institutional compliance failures. This report does not imply or constitute ' +
  'formal institutional course approval, accreditation, or externally validated pedagogical quality.';

/**
 * Builds a structured Human-AI Decision Record from a CombinedDataset.
 */
export function buildDecisionRecord(dataset: CombinedDataset): HumanDecisionRecord {
  const analytics = getRefactoringAnalytics(dataset.suggestions);
  const docMap = new Map(dataset.documents.map(d => [d.id, d.title]));

  const documentVersions = dataset.documents.map(d => {
    const isRefactoredVersion =
      d.title.includes('(Refactored)') ||
      d.blocks.some(b => b.metadata?.refactoredFromSuggestionId);
    const parent = dataset.documents.find(other => other.id !== d.id && d.id.startsWith(other.id));

    return {
      documentId: d.id,
      title: d.title,
      version: d.version,
      author: d.author,
      blockCount: d.blocks.length,
      isRefactoredVersion,
      parentDocumentId: parent?.id
    };
  });

  const outdatedCount = dataset.suggestions.filter(s => s.isOutdated).length;

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
      isOutdated: s.isOutdated,
      outdatedReason: s.outdatedReason,
      reviewedAt: s.reviewedAt,
      reviewerNotes: s.reviewerNotes
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    disclaimer: INSTITUTIONAL_DISCLAIMER,
    governance: {
      aiInvolvement: dataset.aiInvolvement || 'None declared',
      assumptions: dataset.assumptions || 'None declared',
      risks: dataset.risks || 'None declared',
      rationale: dataset.rationale || 'None declared',
      reviewNotes: dataset.reviewNotes || 'None declared'
    },
    documentVersions,
    metrics: {
      totalSuggestions: analytics.total,
      pendingCount: analytics.pending,
      acceptedCount: analytics.accepted,
      modifiedCount: analytics.modified,
      rejectedCount: analytics.rejected,
      outdatedCount,
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
  lines.push(`> **Institutional Governance Notice & Academic Disclaimer:** ${record.disclaimer}`);
  lines.push('');
  lines.push(`- **Record Date:** ${new Date(record.generatedAt).toUTCString()}`);
  lines.push(`- **Schema Version:** ${record.schemaVersion}`);
  lines.push(`- **Total Curriculum Documents / Versions:** ${dataset.documents.length}`);
  lines.push('');

  // 1. Executive Summary & Review Metrics
  lines.push('## 1. Executive Summary & Review Metrics');
  lines.push('');
  lines.push('> **Heuristic Analysis Nature:** Findings in this report represent deterministic text-pattern and token-matching heuristics (e.g. Bloom\'s action verbs, keyword overlap, passive voice, and Jaccard deduplication). They provide diagnostic indicators to guide educator evaluation and must not be conflated with verified pedagogical deficiencies.');
  lines.push('');
  lines.push('| Metric | Value | Description |');
  lines.push('| :--- | :--- | :--- |');
  lines.push(`| **Total Suggestions Evaluated** | ${record.metrics.totalSuggestions} | Total candidate improvements generated |`);
  lines.push(`| **Directly Accepted** | ${record.metrics.acceptedCount} | Accepted as proposed by AI/heuristic |`);
  lines.push(`| **Modified with Oversight** | ${record.metrics.modifiedCount} | Tailored with educator adjustments |`);
  lines.push(`| **Rejected** | ${record.metrics.rejectedCount} | Declined by academic lead |`);
  lines.push(`| **Pending Review** | ${record.metrics.pendingCount} | Awaiting human verification |`);
  if (record.metrics.outdatedCount && record.metrics.outdatedCount > 0) {
    lines.push(`| **Outdated / Stale Baseline** | ${record.metrics.outdatedCount} | Block content changed since review; re-evaluation required |`);
  }
  lines.push(`| **Adoption Rate** | ${record.metrics.acceptanceRatePercent}% | Combined Accepted + Modified proportion |`);
  lines.push('');

  // Document Version Mapping
  if (record.documentVersions && record.documentVersions.length > 0) {
    lines.push('### Document & Version Lineage');
    lines.push('');
    lines.push('| Document Title | Version | Document ID | Blocks | Type | Lineage |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
    record.documentVersions.forEach(dv => {
      const typeLabel = dv.isRefactoredVersion ? 'Refactored Output' : 'Source Document';
      const lineageLabel = dv.parentDocumentId ? `Derived from \`${dv.parentDocumentId}\`` : 'Baseline';
      lines.push(`| ${dv.title} | ${dv.version} | \`${dv.documentId}\` | ${dv.blockCount} | ${typeLabel} | ${lineageLabel} |`);
    });
    lines.push('');
  }

  // 2. Institutional Capability & Governance Declaration
  lines.push('## 2. Institutional Capability & Governance Declaration');
  lines.push('');
  lines.push(`- **Declared AI Involvement:** ${record.governance.aiInvolvement}`);
  lines.push(`- **Pedagogical Assumptions:** ${record.governance.assumptions}`);
  lines.push(`- **Identified Risks or Concerns:** ${record.governance.risks}`);
  lines.push(`- **Refactoring Rationale:** ${record.governance.rationale}`);
  lines.push(`- **Lead Reviewer Notes & Sign-Off:** ${record.governance.reviewNotes}`);
  lines.push('');

  // 3. Itemised Refactoring Decision Audit
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
      if (d.isOutdated) {
        lines.push(`- ⚠️ **Outdated Status:** *${d.outdatedReason || 'Source block changed since review. Re-evaluation required.'}*`);
      }
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

/**
 * Safely escapes HTML special characters to prevent markup injection and XSS.
 * Converts &, <, >, ", and ' to their corresponding standard HTML entities.
 * Safe for null, undefined, numbers, and arbitrary objects.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeDateIso(isoOrDateStr: unknown): string {
  if (!isoOrDateStr || typeof isoOrDateStr !== 'string') return '';
  const d = new Date(isoOrDateStr);
  return isNaN(d.getTime()) ? String(isoOrDateStr).slice(0, 10) : d.toISOString().slice(0, 10);
}

function safeDateFormatted(isoOrDateStr: unknown): string {
  if (!isoOrDateStr || typeof isoOrDateStr !== 'string') return '';
  const d = new Date(isoOrDateStr);
  return isNaN(d.getTime()) ? String(isoOrDateStr) : d.toLocaleString('en-GB');
}

/**
 * Generates a clean, self-contained, printable HTML governance report.
 * Supports direct printing and browser "Save as PDF" via embedded print stylesheets.
 */
export function exportDecisionRecordAsHtml(dataset: CombinedDataset): string {
  const record = buildDecisionRecord(dataset);

  const statusBadge = (status: string, isOutdated?: boolean): string => {
    if (isOutdated) {
      return '<span class="badge badge-outdated">⚠️ Outdated Review</span>';
    }
    switch (status) {
      case 'accepted':
        return '<span class="badge badge-accepted">✓ Accepted</span>';
      case 'modified':
        return '<span class="badge badge-modified">✎ Modified</span>';
      case 'rejected':
        return '<span class="badge badge-rejected">✗ Rejected</span>';
      default:
        return `<span class="badge badge-pending">⏳ ${escapeHtml(status || 'Pending')}</span>`;
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculum Refactoring Decision Record — ${escapeHtml(safeDateIso(record.generatedAt))}</title>
  <style>
    :root {
      --text: #111827;
      --text-muted: #4b5563;
      --bg: #ffffff;
      --surface: #f9fafb;
      --border: #e5e7eb;
      --primary: #111827;
      --success-bg: #f0fdf4;
      --success-text: #166534;
      --warning-bg: #fffbeb;
      --warning-text: #92400e;
      --danger-bg: #fef2f2;
      --danger-text: #991b1b;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      color: var(--text);
      background: var(--bg);
      margin: 0;
      padding: 2.5rem 1.5rem;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--primary);
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 2rem 0 1rem 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
    }
    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    p, li {
      font-size: 0.95rem;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }
    .disclaimer-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #475569;
      padding: 1rem 1.25rem;
      border-radius: 4px;
      margin: 1.5rem 0;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #334155;
    }
    .disclaimer-banner strong {
      color: #0f172a;
    }
    .no-print-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      margin-bottom: 2rem;
    }
    .btn-print {
      background: #111827;
      color: #ffffff;
      border: none;
      padding: 0.5rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 1.5rem 0;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.65rem 0.85rem;
      text-align: left;
    }
    th {
      background: var(--surface);
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-accepted { background: var(--success-bg); color: var(--success-text); border: 1px solid #bbf7d0; }
    .badge-modified { background: var(--warning-bg); color: var(--warning-text); border: 1px solid #fef3c7; }
    .badge-rejected { background: var(--danger-bg); color: var(--danger-text); border: 1px solid #fecaca; }
    .badge-pending { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
    .badge-outdated { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }

    .decision-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .decision-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .code-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0.5rem 0;
    }
    .code-box-adopted {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
        font-size: 11pt;
        color: #000000;
        background: #ffffff;
      }
      .no-print, .no-print-toolbar {
        display: none !important;
      }
      .report-container {
        max-width: 100%;
      }
      .decision-card {
        border-color: #94a3b8;
        page-break-inside: avoid;
      }
      .code-box {
        border-color: #cbd5e1;
        background: #ffffff;
      }
      th {
        background: #f1f5f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      a {
        text-decoration: none;
        color: #000000;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="no-print-toolbar no-print">
      <div>
        <strong>Institutional Governance Export</strong> — Printable HTML &amp; PDF Export
      </div>
      <button type="button" class="btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>

    <header>
      <h1>Institutional Curriculum Governance &amp; Decision Record</h1>
      <div class="meta-bar">
        <span><strong>Generated:</strong> ${escapeHtml(safeDateFormatted(record.generatedAt))}</span>
        <span><strong>Schema Version:</strong> ${escapeHtml(record.schemaVersion)}</span>
        <span><strong>Curriculum Versions:</strong> ${escapeHtml(dataset.documents.length)}</span>
        ${dataset.exportedAt ? `<span><strong>Dataset Export Date:</strong> ${escapeHtml(dataset.exportedAt)}</span>` : ''}
      </div>
    </header>

    <div class="disclaimer-banner">
      <strong>Institutional Governance Notice &amp; Academic Disclaimer:</strong><br>
      ${escapeHtml(record.disclaimer)}
    </div>

    <h2>1. Curriculum Document &amp; Version Lineage</h2>
    <table>
      <thead>
        <tr>
          <th>Document Title</th>
          <th>Version</th>
          <th>Document ID</th>
          <th>Author / Board</th>
          <th>Blocks</th>
          <th>Type</th>
          <th>Lineage</th>
        </tr>
      </thead>
      <tbody>
        ${(record.documentVersions || []).map(dv => `
        <tr>
          <td><strong>${escapeHtml(dv.title)}</strong></td>
          <td><code>${escapeHtml(dv.version)}</code></td>
          <td><code>${escapeHtml(dv.documentId)}</code></td>
          <td>${escapeHtml(dv.author || 'Institutional Lead')}</td>
          <td>${escapeHtml(dv.blockCount)}</td>
          <td>${dv.isRefactoredVersion ? 'Refactored Output' : 'Source Document'}</td>
          <td>${dv.parentDocumentId ? `Derived from <code>${escapeHtml(dv.parentDocumentId)}</code>` : 'Baseline'}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <h2>2. Curriculum Learning Outcomes Baseline</h2>
    ${dataset.learningOutcomes && dataset.learningOutcomes.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Outcome ID</th>
          <th>Blooms Level</th>
          <th>Learning Outcome Statement</th>
        </tr>
      </thead>
      <tbody>
        ${dataset.learningOutcomes.map(lo => `
        <tr>
          <td><code>${escapeHtml(lo.id)}</code></td>
          <td><span class="badge badge-pending">${escapeHtml(lo.level || 'Unspecified')}</span></td>
          <td>${escapeHtml(lo.statement)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<p><em>No learning outcomes recorded in dataset.</em></p>'}

    <h2>3. Review Metrics &amp; Heuristic Summary</h2>
    <p style="font-size: 0.85rem; color: var(--text-muted);">
      <strong>Diagnostic Heuristic Scope:</strong> The findings below reflect deterministic keyword, action verb, and phrase analysis. They do not constitute autonomous assertions of educational merit.
    </p>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Count</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Suggestions Evaluated</strong></td>
          <td>${escapeHtml(record.metrics.totalSuggestions)}</td>
          <td>Heuristic candidate recommendations identified</td>
        </tr>
        <tr>
          <td><strong>Directly Accepted</strong></td>
          <td>${escapeHtml(record.metrics.acceptedCount)}</td>
          <td>Approved as recommended</td>
        </tr>
        <tr>
          <td><strong>Modified with Educator Oversight</strong></td>
          <td>${escapeHtml(record.metrics.modifiedCount)}</td>
          <td>Adjusted with custom academic text</td>
        </tr>
        <tr>
          <td><strong>Rejected by Lead Reviewer</strong></td>
          <td>${escapeHtml(record.metrics.rejectedCount)}</td>
          <td>Declined by academic reviewer</td>
        </tr>
        <tr>
          <td><strong>Pending Academic Evaluation</strong></td>
          <td>${escapeHtml(record.metrics.pendingCount)}</td>
          <td>Awaiting human decision</td>
        </tr>
        ${record.metrics.outdatedCount && record.metrics.outdatedCount > 0 ? `
        <tr>
          <td><strong>Outdated / Stale Baseline</strong></td>
          <td>${escapeHtml(record.metrics.outdatedCount)}</td>
          <td>Block content changed since review; re-evaluation required</td>
        </tr>` : ''}
        <tr>
          <td><strong>Adoption Rate</strong></td>
          <td><strong>${escapeHtml(record.metrics.acceptanceRatePercent)}%</strong></td>
          <td>Combined Accepted + Modified proportion</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Institutional Governance &amp; AI Involvement Declarations</h2>
    <ul>
      <li><strong>Declared AI / Heuristic Involvement:</strong> ${escapeHtml(record.governance.aiInvolvement)}</li>
      <li><strong>Pedagogical Assumptions:</strong> ${escapeHtml(record.governance.assumptions)}</li>
      <li><strong>Identified Risks or Concerns:</strong> ${escapeHtml(record.governance.risks)}</li>
      <li><strong>Refactoring Rationale:</strong> ${escapeHtml(record.governance.rationale)}</li>
      <li><strong>Lead Reviewer Sign-Off &amp; Notes:</strong> ${escapeHtml(record.governance.reviewNotes)}</li>
    </ul>

    <h2>5. Itemised Refactoring Decision Audit</h2>
    ${record.decisions.length === 0 ? '<p><em>No refactoring suggestions recorded.</em></p>' : ''}
    ${record.decisions.map((d, idx) => `
      <div class="decision-card">
        <div class="decision-card-header">
          <div>
            <strong>#${idx + 1} — Suggestion <code>${escapeHtml(d.suggestionId)}</code></strong>
            ${d.documentTitle ? ` &middot; <span>${escapeHtml(d.documentTitle)}</span>` : ''}
            &middot; <span>Block: <code>${escapeHtml(d.targetBlockId)}</code></span>
          </div>
          <div>
            ${statusBadge(d.status, d.isOutdated)}
          </div>
        </div>

        ${d.isOutdated ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-bottom: 0.75rem;">
          ⚠️ <strong>Re-evaluation Required:</strong> ${escapeHtml(d.outdatedReason || 'Underlying block content has changed since this decision was recorded.')}
        </div>` : ''}

        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>Category:</strong> <code>${escapeHtml(d.type)}</code>
          ${d.reviewedAt ? ` &middot; <strong>Reviewed At:</strong> ${escapeHtml(safeDateFormatted(d.reviewedAt))}` : ''}
        </p>

        <p style="margin: 0.5rem 0 0.25rem 0; font-size: 0.85rem;">
          <strong>Diagnostic Rationale:</strong> ${escapeHtml(d.rationale)}
        </p>

        ${d.reviewerNotes ? `
        <p style="margin: 0.25rem 0; font-size: 0.85rem; color: #1e3a8a;">
          <strong>Reviewer Note &amp; Justification:</strong> <em>${escapeHtml(d.reviewerNotes)}</em>
        </p>` : ''}

        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Original Source Content:</div>
          <div class="code-box">${escapeHtml(d.originalContent)}</div>
        </div>

        <div style="margin-top: 0.5rem;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Final Effective Content (${escapeHtml(d.status)}):</div>
          <div class="code-box code-box-adopted">${escapeHtml(d.effectiveContent)}</div>
        </div>
      </div>
    `).join('')}

    <footer>
      <p>CloudPedagogy &middot; Governance-ready AI and curriculum systems &middot; Human-in-the-Loop Standard</p>
    </footer>
  </div>
</body>
</html>`;
}
