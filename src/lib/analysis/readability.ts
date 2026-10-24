import type { ContentBlock } from '../../types';

export interface ReadabilityIssue {
  blockId: string;
  type: 'run-on' | 'passive-voice' | 'wordiness';
  message: string;
  evidence: string;
  suggestedRevision?: string;
}

const PASSIVE_PATTERNS: Array<{ regex: RegExp; replacementHint: string }> = [
  { regex: /\bis defined as\b/i, replacementHint: 'refers to / defines' },
  { regex: /\bcan be seen that\b/i, replacementHint: 'shows that / demonstrates that' },
  { regex: /\bare considered to be\b/i, replacementHint: 'are' },
  { regex: /\bwas developed by\b/i, replacementHint: 'developed' },
  { regex: /\bhas been shown to\b/i, replacementHint: 'demonstrates / shows' },
  { regex: /\bis utilized for\b/i, replacementHint: 'serves to / supports' }
];

/**
 * Analyzes a content block for common academic writing style and readability barriers.
 */
export function analyzeBlockReadability(block: ContentBlock): ReadabilityIssue[] {
  if (block.type === 'heading' || !block.content.trim()) {
    return [];
  }

  const issues: ReadabilityIssue[] = [];
  const sentences = block.content.split(/(?<=[.?!])\s+/).filter(Boolean);

  // 1. Check for excessively long / run-on sentences (> 35 words)
  sentences.forEach(sentence => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 35) {
      issues.push({
        blockId: block.id,
        type: 'run-on',
        message: `Sentence contains ${wordCount} words. Consider splitting into two focused statements for readability.`,
        evidence: sentence.length > 80 ? `${sentence.slice(0, 80)}...` : sentence
      });
    }
  });

  // 2. Check for passive or wordy constructions
  PASSIVE_PATTERNS.forEach(({ regex, replacementHint }) => {
    const match = block.content.match(regex);
    if (match) {
      issues.push({
        blockId: block.id,
        type: 'passive-voice',
        message: `Passive construction "${match[0]}" detected. Consider active academic phrasing (e.g. ${replacementHint}).`,
        evidence: match[0]
      });
    }
  });

  return issues;
}
