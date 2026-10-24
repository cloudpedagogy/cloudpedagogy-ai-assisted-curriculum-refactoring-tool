import { describe, it, expect } from 'vitest';
import {
  buildDecisionRecord,
  escapeHtml,
  exportDecisionRecordAsHtml,
  exportDecisionRecordAsMarkdown,
  INSTITUTIONAL_DISCLAIMER
} from '../lib/io';
import type { CombinedDataset } from '../types';

describe('Batch 3: Accessibility, Usability and Institutional Governance Reporting', () => {
  const createTestDataset = (): CombinedDataset => ({
    schemaVersion: 1,
    documents: [
      {
        id: 'doc-source-1',
        title: 'Cloud Architecture Syllabus',
        version: '1.0',
        blocks: [
          {
            id: 'b-title',
            type: 'heading',
            content: 'Module 1: Principles of Distributed Systems'
          },
          {
            id: 'b-p1',
            type: 'paragraph',
            content: 'In this section, latency is defined as the network round trip time.'
          }
        ]
      },
      {
        id: 'doc-source-1-1.1-refactored',
        title: 'Cloud Architecture Syllabus (Refactored)',
        version: '1.1-refactored',
        blocks: [
          {
            id: 'b-title',
            type: 'heading',
            content: 'Module 1: Principles of Distributed Systems'
          },
          {
            id: 'b-p1',
            type: 'paragraph',
            content: 'In this section, latency refers to the network round trip time.',
            metadata: {
              refactoredFromSuggestionId: 'sug-clarity-1',
              reviewerRationale: 'Approved for active voice clarity'
            }
          }
        ]
      }
    ],
    contentBlocks: [],
    learningOutcomes: [
      {
        id: 'lo-1',
        statement: 'Analyze network latency and throughput in distributed environments.',
        level: 'analysis'
      }
    ],
    suggestions: [
      {
        id: 'sug-clarity-1',
        documentId: 'doc-source-1',
        targetBlockId: 'b-p1',
        type: 'clarity',
        originalContent: 'In this section, latency is defined as the network round trip time.',
        suggestedContent: 'In this section, latency refers to the network round trip time.',
        rationale: 'Active voice clarity recommendation',
        status: 'accepted',
        reviewedAt: '2026-10-24T14:30:00Z',
        reviewerNotes: 'Approved for active voice clarity'
      },
      {
        id: 'sug-gap-2',
        documentId: 'doc-source-1',
        targetBlockId: 'b-title',
        type: 'gap',
        originalContent: 'Module 1: Principles of Distributed Systems',
        suggestedContent: 'Module 1: Principles of Distributed Systems',
        rationale: 'Diagnostic Alignment Review: Block displays minimal explicit keyword overlap with target learning outcomes.',
        status: 'pending'
      },
      {
        id: 'sug-outdated-3',
        documentId: 'doc-source-1',
        targetBlockId: 'b-p1',
        type: 'merge',
        originalContent: 'Stale content baseline from older draft.',
        suggestedContent: 'Consolidated text candidate.',
        rationale: 'Deduplication heuristic',
        status: 'modified',
        modifiedContent: 'Custom educator consolidation.',
        reviewerNotes: 'Consolidated with Module 2',
        reviewedAt: '2026-10-24T14:00:00Z',
        isOutdated: true,
        outdatedReason: 'Underlying block content has changed since this review was recorded.'
      }
    ],
    comparisons: [],
    aiInvolvement: 'Heuristic rule-assisted analysis for clarity, deduplication, and outcome coverage.',
    assumptions: 'Learning outcome Bloom levels reflect intended course cognitive depth.',
    risks: 'Keyword-based alignment may overlook conceptual synonyms not explicitly indexed.',
    rationale: 'Curriculum refactoring for 2027 institutional modernization review.',
    reviewNotes: 'Verified and signed off by the Academic Curriculum Panel.'
  });

  describe('Institutional Governance Reporting & PDF Print Readiness', () => {
    it('builds a complete decision record with version lineage, disclaimers, and outdated tracking', () => {
      const dataset = createTestDataset();
      const record = buildDecisionRecord(dataset);

      expect(record.schemaVersion).toBe(1);
      expect(record.disclaimer).toBe(INSTITUTIONAL_DISCLAIMER);
      expect(record.disclaimer).toContain('does not imply or constitute formal institutional course approval');

      // Version lineage
      expect(record.documentVersions).toHaveLength(2);
      expect(record.documentVersions?.[0].documentId).toBe('doc-source-1');
      expect(record.documentVersions?.[0].isRefactoredVersion).toBe(false);
      expect(record.documentVersions?.[1].documentId).toBe('doc-source-1-1.1-refactored');
      expect(record.documentVersions?.[1].isRefactoredVersion).toBe(true);

      // Metrics
      expect(record.metrics.totalSuggestions).toBe(3);
      expect(record.metrics.acceptedCount).toBe(1);
      expect(record.metrics.modifiedCount).toBe(1);
      expect(record.metrics.pendingCount).toBe(1);
      expect(record.metrics.outdatedCount).toBe(1);

      // Decisions
      const outdatedDecision = record.decisions.find(d => d.suggestionId === 'sug-outdated-3');
      expect(outdatedDecision?.isOutdated).toBe(true);
      expect(outdatedDecision?.outdatedReason).toContain('Underlying block content has changed');
    });

    it('generates a valid, self-contained HTML governance report with print styles and browser PDF triggers', () => {
      const dataset = createTestDataset();
      const html = exportDecisionRecordAsHtml(dataset);

      // HTML structure
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<title>Curriculum Refactoring Decision Record');

      // Print-specific rules
      expect(html).toContain('@media print');
      expect(html).toContain('.no-print');
      expect(html).toContain('onclick="window.print()"');
      expect(html).toContain('Print / Save as PDF');

      // Disclaimers
      expect(html).toContain('Institutional Governance Notice &amp; Academic Disclaimer');
      expect(html).toContain('does not imply or constitute formal institutional course approval');
      expect(html).toContain('Diagnostic Heuristic Scope');

      // Document Lineage
      expect(html).toContain('Cloud Architecture Syllabus');
      expect(html).toContain('Cloud Architecture Syllabus (Refactored)');
      expect(html).toContain('Refactored Output');

      // Decisions and Outdated Status
      expect(html).toContain('sug-clarity-1');
      expect(html).toContain('✓ Accepted');
      expect(html).toContain('sug-outdated-3');
      expect(html).toContain('⚠️ Outdated Review');
      expect(html).toContain('Re-evaluation Required');

      // Governance Declarations
      expect(html).toContain('Heuristic rule-assisted analysis for clarity');
      expect(html).toContain('Verified and signed off by the Academic Curriculum Panel');
    });

    it('generates a comprehensive Markdown governance report adhering to the standard template', () => {
      const dataset = createTestDataset();
      const md = exportDecisionRecordAsMarkdown(dataset);

      expect(md).toContain('# Human–AI Curriculum Decision Record');
      expect(md).toContain('## 1. Executive Summary & Review Metrics');
      expect(md).toContain('## 2. Institutional Capability & Governance Declaration');
      expect(md).toContain('## 3. Itemised Refactoring Decision Audit');
      expect(md).toContain('Document & Version Lineage');
      expect(md).toContain('Cloud Architecture Syllabus (Refactored)');
      expect(md).toContain('Outdated / Stale Baseline');
      expect(md).toContain('⚠️ **Outdated Status:**');
      expect(md).toContain('does not imply or constitute formal institutional course approval');
    });
  });

  describe('Accessibility & WCAG 2.2 AA Contrast & Independent Indicators', () => {
    it('verifies that disclaimers explicitly distinguish heuristics from verified educational deficiencies', () => {
      expect(INSTITUTIONAL_DISCLAIMER).toContain('Heuristic findings are diagnostic indicators');
      expect(INSTITUTIONAL_DISCLAIMER).toContain('must NOT be interpreted as verified educational deficiencies');
    });

    it('verifies that decision metrics report outdated and blocked counts transparently', () => {
      const dataset = createTestDataset();
      const record = buildDecisionRecord(dataset);
      expect(record.metrics.outdatedCount).toBe(1);
    });
  });

  describe('HTML Governance Report Safety & Injection Mitigation', () => {
    it('escapes standard HTML special characters correctly via escapeHtml', () => {
      expect(escapeHtml('AT&T and R&D')).toBe('AT&amp;T and R&amp;D');
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml("O'Connor's Selection")).toBe('O&#039;Connor&#039;s Selection');
      expect(escapeHtml('A > B && C < D')).toBe('A &gt; B &amp;&amp; C &lt; D');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(0)).toBe('0');
      expect(escapeHtml(42)).toBe('42');
      expect(escapeHtml(false)).toBe('false');
    });

    it('safely renders HTML governance report with malicious payloads in all user-controlled text vectors', () => {
      const injectionDataset: CombinedDataset = {
        schemaVersion: 1,
        exportedAt: '2026-10-24T18:00:00Z"><script>alert("meta-xss")</script>',
        documents: [
          {
            id: 'doc-<svg/onload=alert("doc-id")>',
            title: 'Syllabus <script>alert("doc-title")</script> & "Advanced"',
            version: '1.0"<script>alert("doc-ver")</script>',
            author: 'Faculty Board <img src=x onerror=alert("doc-author")>',
            blocks: [
              {
                id: 'b-vuln-1',
                type: 'paragraph',
                content: 'Block text with <iframe src="javascript:alert(\'block-content\')"> & "special"'
              }
            ]
          }
        ],
        contentBlocks: [],
        learningOutcomes: [
          {
            id: 'lo-<script>alert("lo-id")</script>',
            statement: 'Critique distributed systems using <svg onload=alert(document.cookie)> & "SQL Injection"',
            level: 'evaluation'
          }
        ],
        suggestions: [
          {
            id: 'sug-<script>alert("sug-id")</script>',
            documentId: 'doc-<svg/onload=alert("doc-id")>',
            targetBlockId: 'b-<img src=x onerror=alert("target-block")>',
            type: 'gap',
            originalContent: 'Original block content with <script>alert("orig-content")</script> & "quotes"',
            suggestedContent: 'Candidate rewrite with <img src=x onerror=alert("sug-content")>',
            modifiedContent: 'Educator modification with <b onmouseover="alert(\'mod-content\')">hover</b>',
            rationale: 'Diagnostic heuristic: A < B && C > D "strict" & \'check\'',
            status: 'modified',
            reviewerNotes: 'Approved with conditions <a href="javascript:alert(\'reviewer-notes\')">Click</a>',
            reviewedAt: '2026-10-24T19:00:00Z',
            isOutdated: true,
            outdatedReason: 'Underlying block <#999> modified by user & reviewer'
          }
        ],
        comparisons: [],
        aiInvolvement: 'Heuristic tool <script>alert("ai-involvement")</script>',
        assumptions: 'Course assumptions <style>body{display:none;}</style>',
        risks: 'Identified risk <marquee onstart=alert("risks")>text</marquee>',
        rationale: 'Pedagogical basis <object data="javascript:alert(\'rat\')"></object>',
        reviewNotes: 'Final sign-off <embed src="javascript:alert(\'notes\')">'
      };

      const html = exportDecisionRecordAsHtml(injectionDataset);

      // Verify that NO executable/raw HTML markup or active tags exist unescaped
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('</script>');
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<img');
      expect(html).not.toContain('<svg');
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('<style>body');
      expect(html).not.toContain('<marquee');
      expect(html).not.toContain('<object');
      expect(html).not.toContain('<embed');
      expect(html).not.toMatch(/<[a-z0-9]+[^>]*\bonerror\s*=/i);
      expect(html).not.toMatch(/<[a-z0-9]+[^>]*\bonload\s*=/i);
      expect(html).not.toMatch(/<[a-z0-9]+[^>]*\bonmouseover\s*=/i);
      expect(html).not.toMatch(/<[a-z0-9]+[^>]*\bonstart\s*=/i);
      expect(html).not.toContain('<a href="javascript:');
      expect(html).not.toContain('href="javascript:');
      expect(html).not.toContain('src="javascript:');
      expect(html).not.toContain('data="javascript:');

      // Verify that all user-controlled text is rendered as escaped HTML entities
      // 1. Document title, author, version, id
      expect(html).toContain('Syllabus &lt;script&gt;alert(&quot;doc-title&quot;)&lt;/script&gt; &amp; &quot;Advanced&quot;');
      expect(html).toContain('Faculty Board &lt;img src=x onerror=alert(&quot;doc-author&quot;)&gt;');
      expect(html).toContain('1.0&quot;&lt;script&gt;alert(&quot;doc-ver&quot;)&lt;/script&gt;');
      expect(html).toContain('doc-&lt;svg/onload=alert(&quot;doc-id&quot;)&gt;');

      // 2. Learning outcomes
      expect(html).toContain('lo-&lt;script&gt;alert(&quot;lo-id&quot;)&lt;/script&gt;');
      expect(html).toContain('Critique distributed systems using &lt;svg onload=alert(document.cookie)&gt; &amp; &quot;SQL Injection&quot;');
      expect(html).toContain('evaluation');

      // 3. Suggestion original, suggested, and modified content
      expect(html).toContain('Original block content with &lt;script&gt;alert(&quot;orig-content&quot;)&lt;/script&gt; &amp; &quot;quotes&quot;');
      expect(html).toContain('Educator modification with &lt;b onmouseover=&quot;alert(&#039;mod-content&#039;)&quot;&gt;hover&lt;/b&gt;');

      // 4. Reviewer notes and rationale
      expect(html).toContain('Approved with conditions &lt;a href=&quot;javascript:alert(&#039;reviewer-notes&#039;)&quot;&gt;Click&lt;/a&gt;');
      expect(html).toContain('Diagnostic heuristic: A &lt; B &amp;&amp; C &gt; D &quot;strict&quot; &amp; &#039;check&#039;');
      expect(html).toContain('Underlying block &lt;#999&gt; modified by user &amp; reviewer');

      // 5. Governance declarations
      expect(html).toContain('Heuristic tool &lt;script&gt;alert(&quot;ai-involvement&quot;)&lt;/script&gt;');
      expect(html).toContain('Course assumptions &lt;style&gt;body{display:none;}&lt;/style&gt;');
      expect(html).toContain('Identified risk &lt;marquee onstart=alert(&quot;risks&quot;)&gt;text&lt;/marquee&gt;');
      expect(html).toContain('Pedagogical basis &lt;object data=&quot;javascript:alert(&#039;rat&#039;)&quot;&gt;&lt;/object&gt;');
      expect(html).toContain('Final sign-off &lt;embed src=&quot;javascript:alert(&#039;notes&#039;)&quot;&gt;');

      // 6. Dataset metadata
      expect(html).toContain('2026-10-24T18:00:00Z&quot;&gt;&lt;script&gt;alert(&quot;meta-xss&quot;)&lt;/script&gt;');
    });

    it('renders clean fallback when learning outcomes list is empty', () => {
      const dataset: CombinedDataset = {
        schemaVersion: 1,
        documents: [],
        contentBlocks: [],
        learningOutcomes: [],
        suggestions: [],
        comparisons: []
      };

      const html = exportDecisionRecordAsHtml(dataset);
      expect(html).toContain('No learning outcomes recorded in dataset.');
    });
  });
});
