import { describe, it, expect } from 'vitest';
import {
  analyzeBloomVerb,
  checkOutcomesQuality
} from '../lib/analysis/bloomsTaxonomy';
import type { LearningOutcome } from '../types';

describe('Revised Bloom\'s Taxonomy Heuristic Indicators', () => {
  it('correctly categorises action verbs across all 6 cognitive domains', () => {
    // 1. Remembering
    const res1 = analyzeBloomVerb('Identify three primary cloud deployment models.');
    expect(res1.inferredLevel).toBe('remembering');
    expect(res1.detectedVerb).toBe('identify');
    expect(res1.isVague).toBe(false);

    // 2. Understanding
    const res2 = analyzeBloomVerb('Explain the difference between IaaS and PaaS.');
    expect(res2.inferredLevel).toBe('understanding');
    expect(res2.detectedVerb).toBe('explain');

    // 3. Applying
    const res3 = analyzeBloomVerb('Implement a multi-region VPC deployment using Terraform.');
    expect(res3.inferredLevel).toBe('applying');
    expect(res3.detectedVerb).toBe('implement');

    // 4. Analysing
    const res4 = analyzeBloomVerb('Analyse latency bottlenecks in distributed microservices.');
    expect(res4.inferredLevel).toBe('analysing');
    expect(res4.detectedVerb).toBe('analyse');

    // 5. Evaluating
    const res5 = analyzeBloomVerb('Evaluate the security trade-offs of public vs private subnets.');
    expect(res5.inferredLevel).toBe('evaluating');
    expect(res5.detectedVerb).toBe('evaluate');

    // 6. Creating
    const res6 = analyzeBloomVerb('Design a fault-tolerant cloud architecture.');
    expect(res6.inferredLevel).toBe('creating');
    expect(res6.detectedVerb).toBe('design');
  });

  it('flags non-measurable vague verbs and suggests observable alternatives', () => {
    const res1 = analyzeBloomVerb('Understand the principles of cloud security.');
    expect(res1.isVague).toBe(true);
    expect(res1.detectedVerb).toBe('understand');
    expect(res1.suggestedAlternatives.length).toBeGreaterThan(0);
    expect(res1.rationale).toContain('potentially non-measurable');

    const res2 = analyzeBloomVerb('Students will know all AWS services.');
    expect(res2.isVague).toBe(true);
    expect(res2.detectedVerb).toBe('know');

    const res3 = analyzeBloomVerb('Learn fundamental data pipeline structures.');
    expect(res3.isVague).toBe(true);
    expect(res3.detectedVerb).toBe('learn');
  });

  it('detects multi-word vague phrases', () => {
    const res = analyzeBloomVerb('Be familiar with modern DevOps practices.');
    expect(res.isVague).toBe(true);
    expect(res.detectedVerb).toBe('be familiar with');
    expect(res.suggestedAlternatives).toContain('explain');
  });

  it('skips common leading filler words to extract the operative verb', () => {
    const res1 = analyzeBloomVerb('Students will demonstrate effective load balancing.');
    expect(res1.detectedVerb).toBe('demonstrate');
    expect(res1.inferredLevel).toBe('applying');

    const res2 = analyzeBloomVerb('To critically evaluate automated remediation scripts.');
    expect(res2.detectedVerb).toBe('evaluate');
    expect(res2.inferredLevel).toBe('evaluating');
  });

  it('identifies discrepancies between declared level and detected action verb without imposing judgement', () => {
    // Verb is "list" (Remembering, level 1), but declared is "evaluation" (Level 5)
    const res = analyzeBloomVerb('List the core components of Kubernetes.', 'evaluation');
    expect(res.inferredLevel).toBe('remembering');
    expect(res.declaredLevel).toBe('evaluation');
    expect(res.levelMatch).toBe(false);
    expect(res.rationale).toContain('indicates remembering');
    expect(res.rationale).toContain('declared level is evaluating');
  });

  it('handles empty or blank statements safely without error', () => {
    const emptyRes = analyzeBloomVerb('   ');
    expect(emptyRes.detectedVerb).toBeNull();
    expect(emptyRes.isVague).toBe(false);
    expect(emptyRes.inferredLevel).toBeNull();
  });

  it('batch inspects outcomes quality via checkOutcomesQuality', () => {
    const outcomes: LearningOutcome[] = [
      { id: 'lo-1', statement: 'Analyze network telemetry for anomaly detection.', level: 'analysis' },
      { id: 'lo-2', statement: 'Understand cloud compliance frameworks.', level: 'comprehension' }
    ];

    const results = checkOutcomesQuality(outcomes);
    expect(results).toHaveLength(2);
    expect(results[0].analysis.detectedVerb).toBe('analyze');
    expect(results[0].analysis.isVague).toBe(false);
    expect(results[1].analysis.isVague).toBe(true);
  });
});
