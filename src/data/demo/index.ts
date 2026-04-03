import type { ContentDocument, ContentBlock, LearningOutcome, CombinedDataset } from '../../types';

const version1Blocks: ContentBlock[] = [
  { id: 'v1-b1', type: 'heading', content: 'Epidemiology 101: Foundations' },
  { id: 'v1-b2', type: 'paragraph', content: 'Epidemiology is the science of disease distribution in human populations.', tags: ['foundation', 'definition'] },
  { id: 'v1-b3', type: 'paragraph', content: 'It focuses on identifying risk factors and preventative measures.', tags: ['application'] }
];

const version2Blocks: ContentBlock[] = [
  { id: 'v2-b1', type: 'heading', content: 'Modern Epidemiology Concepts' },
  { id: 'v2-b2', type: 'paragraph', content: 'Epidemiology is defined as the study and analysis of distribution and determinants of health conditions.', tags: ['definition', 'precision'] },
  { id: 'v2-b3', type: 'paragraph', content: 'Applications include clinical research and public health policy development.', tags: ['application', 'policy'] }
];

const version3Blocks: ContentBlock[] = [
  { id: 'v3-b1', type: 'heading', content: 'Applied Epidemiology & Public Health' },
  { id: 'v3-b2', type: 'paragraph', content: 'Epidemiology is the systematic study and analysis of health patterns, focusing on evidence-based intervention.', tags: ['definition', 'systematic'] },
  { id: 'v3-b3', type: 'paragraph', content: 'Key areas: infectious disease, chronic illness, and environmental health.', tags: ['application', 'specialization'] }
];

export const demoDocuments: ContentDocument[] = [
  {
    id: 'doc-v1',
    title: 'Epidemiology (Legacy Version)',
    version: '2018.1',
    author: 'Dept. of Public Health',
    blocks: version1Blocks
  },
  {
    id: 'doc-v2',
    title: 'Epidemiology (Current Version)',
    version: '2022.4',
    author: 'Curriculum Board',
    blocks: version2Blocks
  },
  {
    id: 'doc-v3',
    title: 'Epidemiology (2025 Revised)',
    version: '2025.0-alpha',
    author: 'AI-Enhanced Review Panel',
    blocks: version3Blocks
  }
];

export const demoLearningOutcomes: LearningOutcome[] = [
  { id: 'lo-1', statement: 'Critically analyze population health patterns.', level: 'analysis' },
  { id: 'lo-2', statement: 'Design evidence-based public health interventions.', level: 'synthesis' }
];

export const demoDataset: CombinedDataset = {
  documents: demoDocuments,
  contentBlocks: [...version1Blocks, ...version2Blocks, ...version3Blocks],
  learningOutcomes: demoLearningOutcomes,
  suggestions: [
    {
      id: 'sug-1',
      targetBlockId: 'v1-b2',
      type: 'update',
      originalContent: 'Epidemiology is the science of disease distribution in human populations.',
      suggestedContent: 'Epidemiology is the systematic study and analysis of distribution and determinants of health conditions, focusing on evidence-based intervention strategies.',
      rationale: 'Reason: Recommended update to modern systematic definition for academic precision.',
      status: 'pending'
    },
    {
      id: 'sug-2',
      targetBlockId: 'v1-b3',
      type: 'merge',
      originalContent: 'It focuses on identifying risk factors and preventative measures.',
      suggestedContent: 'It focuses on identifying risk factors, determinants of health, and data-driven preventative measures.',
      rationale: 'Reason: Overlapping theme with current public health policy standards (Deduplication).',
      status: 'accepted'
    },
    {
      id: 'sug-3',
      targetBlockId: 'v2-b1',
      type: 'clarity',
      originalContent: 'Modern Epidemiology Concepts',
      suggestedContent: 'Foundations of Modern Epidemiology and Public Health Practice',
      rationale: 'Reason: Improved alignment with Learning Outcome #1 (Analysis).',
      status: 'rejected'
    }
  ],
  comparisons: []
};
