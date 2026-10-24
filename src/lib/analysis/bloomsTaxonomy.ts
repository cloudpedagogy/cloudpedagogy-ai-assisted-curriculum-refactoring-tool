import type { LearningOutcome } from '../../types';

export type CognitiveDomain = 'remembering' | 'understanding' | 'applying' | 'analysing' | 'evaluating' | 'creating';

export interface BloomVerbIndicator {
  level: CognitiveDomain;
  levelNumber: number;
  verbs: string[];
}

export const BLOOM_DOMAINS: Record<CognitiveDomain, BloomVerbIndicator> = {
  remembering: {
    level: 'remembering',
    levelNumber: 1,
    verbs: ['recall', 'list', 'recognize', 'recognise', 'identify', 'name', 'locate', 'define', 'repeat', 'state', 'retrieve']
  },
  understanding: {
    level: 'understanding',
    levelNumber: 2,
    verbs: ['explain', 'describe', 'summarize', 'summarise', 'interpret', 'classify', 'compare', 'paraphrase', 'clarify', 'exemplify', 'discuss', 'outline']
  },
  applying: {
    level: 'applying',
    levelNumber: 3,
    verbs: ['apply', 'implement', 'execute', 'solve', 'demonstrate', 'calculate', 'operate', 'use', 'carry out', 'employ', 'illustrate']
  },
  analysing: {
    level: 'analysing',
    levelNumber: 4,
    verbs: ['analyze', 'analyse', 'differentiate', 'deconstruct', 'distinguish', 'examine', 'categorize', 'categorise', 'contrast', 'investigate', 'attribute']
  },
  evaluating: {
    level: 'evaluating',
    levelNumber: 5,
    verbs: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'appraise', 'validate', 'defend', 'rate', 'prioritize', 'prioritise']
  },
  creating: {
    level: 'creating',
    levelNumber: 6,
    verbs: ['design', 'formulate', 'construct', 'develop', 'create', 'compose', 'generate', 'synthesize', 'synthesise', 'devise', 'plan', 'produce']
  }
};

/**
 * Common non-measurable or vague verbs frequently flagged in curriculum quality standards.
 */
export const VAGUE_VERBS = new Set([
  'understand',
  'know',
  'learn',
  'be familiar with',
  'appreciate',
  'grasp',
  'comprehend',
  'become aware of',
  'study',
  'expose'
]);

export interface VerbAnalysisResult {
  detectedVerb: string | null;
  isVague: boolean;
  suggestedAlternatives: string[];
  inferredLevel: CognitiveDomain | null;
  declaredLevel: string | null;
  levelMatch: boolean;
  rationale: string;
}

/**
 * Normalizes text to extract candidate initial action verbs.
 */
function extractLeadWords(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z\s-]/g, ' ').trim();
  return clean.split(/\s+/).filter(Boolean);
}

/**
 * Analyzes a learning outcome or pedagogical statement for measurable action verbs
 * and flags potentially vague educational language.
 */
export function analyzeBloomVerb(statement: string, declaredLevel?: string): VerbAnalysisResult {
  const words = extractLeadWords(statement);
  if (words.length === 0) {
    return {
      detectedVerb: null,
      isVague: false,
      suggestedAlternatives: [],
      inferredLevel: null,
      declaredLevel: declaredLevel || null,
      levelMatch: true,
      rationale: 'Statement contains no discernible text.'
    };
  }

  // Check multi-word vague phrases first
  const lowerStatement = statement.toLowerCase();
  for (const phrase of ['be familiar with', 'become aware of']) {
    if (lowerStatement.includes(phrase)) {
      return {
        detectedVerb: phrase,
        isVague: true,
        suggestedAlternatives: ['identify', 'explain', 'describe'],
        inferredLevel: 'understanding',
        declaredLevel: declaredLevel || null,
        levelMatch: false,
        rationale: `Phrase "${phrase}" is difficult to assess directly. Consider observable verbs such as "identify", "explain", or "describe".`
      };
    }
  }

  // Check the first 3 words for lead verbs (e.g. "Critically analyze", "To identify", "Students will demonstrate")
  let leadVerb: string | null = null;
  for (const w of words.slice(0, 4)) {
    if (['to', 'students', 'will', 'critically', 'effectively', 'accurately', 'the'].includes(w)) {
      continue;
    }
    leadVerb = w;
    break;
  }

  if (!leadVerb) {
    leadVerb = words[0];
  }

  // Check if lead verb is explicitly vague
  if (VAGUE_VERBS.has(leadVerb)) {
    const targetDomain: CognitiveDomain = declaredLevel && declaredLevel in BLOOM_DOMAINS 
      ? (declaredLevel as CognitiveDomain) 
      : 'understanding';
    const alternatives = BLOOM_DOMAINS[targetDomain]?.verbs.slice(0, 4) || ['explain', 'demonstrate', 'analyze'];
    return {
      detectedVerb: leadVerb,
      isVague: true,
      suggestedAlternatives: alternatives,
      inferredLevel: null,
      declaredLevel: declaredLevel || null,
      levelMatch: false,
      rationale: `Action verb "${leadVerb}" is potentially non-measurable. Consider replacing with observable actions such as ${alternatives.map(a => `"${a}"`).join(', ')}.`
    };
  }

  // Match against Revised Bloom's domains
  let detectedDomain: CognitiveDomain | null = null;
  for (const [domain, indicator] of Object.entries(BLOOM_DOMAINS)) {
    if (indicator.verbs.includes(leadVerb)) {
      detectedDomain = domain as CognitiveDomain;
      break;
    }
  }

  // Map legacy declared level names if needed
  const normalizedDeclared = declaredLevel?.toLowerCase();
  const declaredDomain: CognitiveDomain | null = 
    normalizedDeclared === 'knowledge' ? 'remembering' :
    normalizedDeclared === 'comprehension' ? 'understanding' :
    normalizedDeclared === 'application' ? 'applying' :
    normalizedDeclared === 'analysis' ? 'analysing' :
    normalizedDeclared === 'synthesis' ? 'creating' :
    normalizedDeclared === 'evaluation' ? 'evaluating' :
    (normalizedDeclared as CognitiveDomain) || null;

  const levelMatch = !declaredDomain || !detectedDomain || declaredDomain === detectedDomain;

  let rationale = `Action verb "${leadVerb}" aligns with Bloom's ${detectedDomain || 'general'} cognitive domain.`;
  if (!levelMatch && detectedDomain && declaredDomain) {
    rationale = `Detected verb "${leadVerb}" indicates ${detectedDomain} (Level ${BLOOM_DOMAINS[detectedDomain].levelNumber}), whereas declared level is ${declaredDomain} (Level ${BLOOM_DOMAINS[declaredDomain].levelNumber}).`;
  }

  return {
    detectedVerb: leadVerb,
    isVague: false,
    suggestedAlternatives: detectedDomain ? BLOOM_DOMAINS[detectedDomain].verbs.filter(v => v !== leadVerb).slice(0, 3) : [],
    inferredLevel: detectedDomain,
    declaredLevel: declaredLevel || null,
    levelMatch,
    rationale
  };
}

/**
 * Validates a list of outcomes against Bloom's indicators without imposing rigid judgements.
 */
export function checkOutcomesQuality(outcomes: LearningOutcome[]): Array<{ outcome: LearningOutcome; analysis: VerbAnalysisResult }> {
  return outcomes.map(lo => ({
    outcome: lo,
    analysis: analyzeBloomVerb(lo.statement, lo.level)
  }));
}
