import { describe, it, expect } from 'vitest';
import {
  exportDatasetAsJson,
  exportCurriculumAsMarkdown,
  buildDecisionRecord,
  exportDecisionRecordAsJson,
  exportDecisionRecordAsMarkdown,
  parseAndValidateImport
} from '../lib/io';
import { demoDataset } from '../data/demo';

describe('Import & Export Subsystems', () => {
  it('performs full lossless JSON roundtrip serialization and import', () => {
    const exportedJson = exportDatasetAsJson(demoDataset);
    expect(exportedJson).toContain('"schemaVersion": 1');
    expect(exportedJson).toContain('"exportedAt":');

    const importResult = parseAndValidateImport(exportedJson);
    expect(importResult.success).toBe(true);
    expect(importResult.dataset).toBeDefined();
    expect(importResult.dataset?.documents).toHaveLength(demoDataset.documents.length);
    expect(importResult.dataset?.learningOutcomes).toHaveLength(demoDataset.learningOutcomes.length);
    expect(importResult.dataset?.suggestions).toHaveLength(demoDataset.suggestions.length);
  });

  it('exports formatted academic curriculum Markdown with outcomes and content', () => {
    const md = exportCurriculumAsMarkdown(demoDataset);
    expect(md).toContain('# Epidemiology (Legacy Version)');
    expect(md).toContain('## Course Learning Outcomes');
    expect(md).toContain('Critically analyze population health patterns');
    expect(md).toContain('### Epidemiology 101: Foundations');
    expect(md).toContain('Epidemiology is the science of disease distribution');

    // Single document filter
    const singleMd = exportCurriculumAsMarkdown(demoDataset, 'doc-v2');
    expect(singleMd).toContain('# Epidemiology (Current Version)');
    expect(singleMd).not.toContain('# Epidemiology (Legacy Version)');
  });

  it('generates a complete Human–AI Decision Record with metrics and itemised audit', () => {
    const record = buildDecisionRecord(demoDataset);
    expect(record.schemaVersion).toBe(1);
    expect(record.metrics.totalSuggestions).toBe(3);
    expect(record.metrics.pendingCount).toBe(1);
    expect(record.metrics.acceptedCount).toBe(1);
    expect(record.metrics.rejectedCount).toBe(1);
    // Accepted (1) + Modified (0) out of 3 = 33.3%
    expect(record.metrics.acceptanceRatePercent).toBe(33.3);
    expect(record.decisions).toHaveLength(3);

    const mdRecord = exportDecisionRecordAsMarkdown(demoDataset);
    expect(mdRecord).toContain('# Human–AI Curriculum Decision Record');
    expect(mdRecord).toContain('## 1. Executive Summary & Review Metrics');
    expect(mdRecord).toContain('## 2. Institutional Capability & Governance Declaration');
    expect(mdRecord).toContain('## 3. Itemised Refactoring Decision Audit');
    expect(mdRecord).toContain('[ACCEPTED] — Suggestion `sug-2`');

    const jsonRecord = exportDecisionRecordAsJson(demoDataset);
    const parsed = JSON.parse(jsonRecord);
    expect(parsed.metrics.totalSuggestions).toBe(3);
  });

  it('imports an array of ContentDocument objects gracefully', () => {
    const docArrayJson = JSON.stringify([
      {
        id: 'external-doc-1',
        title: 'Imported Module A',
        version: 'v1.0',
        blocks: [
          { id: 'b1', type: 'heading', content: 'Introduction to Bioethics' },
          { id: 'b2', type: 'paragraph', content: 'Bioethics examines moral choices in healthcare.' }
        ]
      }
    ]);

    const result = parseAndValidateImport(docArrayJson);
    expect(result.success).toBe(true);
    expect(result.dataset?.documents).toHaveLength(1);
    expect(result.dataset?.documents[0].title).toBe('Imported Module A');
    expect(result.dataset?.contentBlocks).toHaveLength(2);
  });

  it('imports a single ContentDocument object cleanly', () => {
    const singleDocJson = JSON.stringify({
      id: 'single-doc',
      title: 'Solo Syllabus',
      version: '2026',
      blocks: [
        { id: 'sb-1', type: 'heading', content: 'Clinical Pharmacology' },
        { id: 'sb-2', type: 'paragraph', content: 'Study of drug interactions.' }
      ]
    });

    const result = parseAndValidateImport(singleDocJson);
    expect(result.success).toBe(true);
    expect(result.dataset?.documents).toHaveLength(1);
    expect(result.dataset?.documents[0].id).toBe('single-doc');
  });

  it('provides detailed error feedback for invalid schema imports', () => {
    const invalidJson = JSON.stringify({
      schemaVersion: 1,
      documents: [
        { id: 'd1', title: 'Doc Without Blocks' } // Missing blocks array
      ]
    });

    const result = parseAndValidateImport(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('missing or invalid "blocks" array');
  });
});
