import {
  CURRENT_SCHEMA_VERSION,
  type CombinedDataset,
  type ContentDocument,
  type LearningOutcome,
  type RefactoringSuggestion,
  type ComparisonResult,
  type ValidationResult
} from '../../types';

const VALID_BLOCK_TYPES = new Set(['paragraph', 'heading', 'list', 'image', 'video', 'interaction']);
const VALID_SUGGESTION_STATUSES = new Set(['pending', 'accepted', 'rejected', 'modified']);
const VALID_SUGGESTION_TYPES = new Set(['merge', 'gap', 'update', 'clarity', 'sequence']);
const VALID_OUTCOME_LEVELS = new Set(['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation']);

/**
 * Ensures documents are the single source of truth by re-projecting contentBlocks.
 */
export function synchronizeDatasetBlocks(dataset: CombinedDataset): CombinedDataset {
  const allBlocks = dataset.documents.flatMap(doc => doc.blocks);
  return {
    ...dataset,
    contentBlocks: allBlocks
  };
}

/**
 * Validates referential integrity:
 * 1. Resolves and assigns documentId for suggestions if missing and uniquely determinable.
 * 2. If targetBlockId occurs in multiple documents, reports ambiguity and leaves unassociated.
 * 3. Checks that every suggestion targets an existing block ID.
 * 4. Checks that comparison source and target documents exist.
 */
export function repairAndValidateIntegrity(dataset: CombinedDataset): {
  dataset: CombinedDataset;
  warnings: string[];
} {
  const warnings: string[] = [];
  const blockToDocsMap = new Map<string, string[]>(); // blockId -> array of docIds containing this block
  const docIds = new Set(dataset.documents.map(d => d.id));

  dataset.documents.forEach(doc => {
    doc.blocks.forEach(block => {
      const existing = blockToDocsMap.get(block.id) || [];
      if (!existing.includes(doc.id)) {
        existing.push(doc.id);
      }
      blockToDocsMap.set(block.id, existing);
    });
  });

  const updatedSuggestions: RefactoringSuggestion[] = dataset.suggestions.map(s => {
    let docId = s.documentId;
    const matchingDocs = blockToDocsMap.get(s.targetBlockId) || [];

    if (!docId) {
      if (matchingDocs.length === 1) {
        docId = matchingDocs[0];
        warnings.push(`Suggestion "${s.id}" had no documentId; uniquely mapped to document "${docId}".`);
      } else if (matchingDocs.length > 1) {
        // Ambiguity detected: block ID appears in multiple documents
        // Do NOT silently map to an arbitrary document!
        warnings.push(
          `Ambiguous block reference: Suggestion "${s.id}" targets block "${s.targetBlockId}" which exists in multiple documents (${matchingDocs.join(', ')}). Retained without documentId association.`
        );
      } else {
        warnings.push(`Suggestion "${s.id}" references targetBlockId "${s.targetBlockId}" which does not exist in any document.`);
      }
    } else {
      // documentId is provided; verify validity
      if (!docIds.has(docId)) {
        warnings.push(`Suggestion "${s.id}" references non-existent documentId "${docId}".`);
      } else if (!matchingDocs.includes(docId)) {
        warnings.push(`Suggestion "${s.id}" specifies documentId "${docId}", but target block "${s.targetBlockId}" was not found in that document.`);
      }
    }

    return {
      ...s,
      documentId: docId
    };
  });

  dataset.comparisons.forEach(comp => {
    if (!docIds.has(comp.sourceDocId)) {
      warnings.push(`Comparison "${comp.id}" references non-existent sourceDocId "${comp.sourceDocId}".`);
    }
    if (!docIds.has(comp.targetDocId)) {
      warnings.push(`Comparison "${comp.id}" references non-existent targetDocId "${comp.targetDocId}".`);
    }
  });

  const repaired = synchronizeDatasetBlocks({
    ...dataset,
    suggestions: updatedSuggestions
  });

  return { dataset: repaired, warnings };
}

/**
 * Result of merging two datasets.
 */
export interface MergeResult {
  dataset: CombinedDataset;
  warnings: string[];
  stats: {
    documentsAdded: number;
    documentsRenamed: number;
    documentsSkipped: number;
    blocksRemapped: number;
    outcomesAdded: number;
    outcomesRenamed: number;
    outcomesSkipped: number;
    suggestionsAdded: number;
    suggestionsRenamed: number;
  };
}

/**
 * Safely merges an incoming dataset into an existing dataset:
 * - Detects duplicate document IDs; renames conflicting incoming documents to prevent silent overwriting.
 * - Detects duplicate content block IDs across documents; remaps block IDs and associated suggestions to prevent cross-document confusion.
 * - Deduplicates identical learning outcomes and renames conflicting outcome IDs.
 * - Detects duplicate suggestion IDs and ensures suggestions point to valid (remapped) documents and blocks.
 */
export function mergeDatasets(
  existing: CombinedDataset,
  incoming: CombinedDataset
): MergeResult {
  const warnings: string[] = [];
  const stats = {
    documentsAdded: 0,
    documentsRenamed: 0,
    documentsSkipped: 0,
    blocksRemapped: 0,
    outcomesAdded: 0,
    outcomesRenamed: 0,
    outcomesSkipped: 0,
    suggestionsAdded: 0,
    suggestionsRenamed: 0
  };

  const existingDocMap = new Map(existing.documents.map(d => [d.id, d]));
  const existingBlockIds = new Set(existing.documents.flatMap(d => d.blocks.map(b => b.id)));
  const existingOutcomeMap = new Map(existing.learningOutcomes.map(o => [o.id, o]));
  const existingSugIds = new Set(existing.suggestions.map(s => s.id));

  const docIdRemap = new Map<string, string>(); // incoming old docId -> new docId
  const blockIdRemap = new Map<string, string>(); // incoming old blockId -> new blockId

  const mergedDocuments: ContentDocument[] = [...existing.documents];

  // 1. Merge Documents & re-namespace colliding block IDs
  incoming.documents.forEach((incomingDoc, idx) => {
    let finalDocId = incomingDoc.id;
    let finalDocTitle = incomingDoc.title;

    if (existingDocMap.has(incomingDoc.id)) {
      const existingDoc = existingDocMap.get(incomingDoc.id)!;
      const isContentIdentical =
        existingDoc.title === incomingDoc.title &&
        existingDoc.blocks.length === incomingDoc.blocks.length &&
        existingDoc.blocks.every((b, i) => b.id === incomingDoc.blocks[i]?.id && b.content === incomingDoc.blocks[i]?.content);

      if (isContentIdentical) {
        stats.documentsSkipped++;
        warnings.push(`Document "${incomingDoc.title}" (${incomingDoc.id}) is identical to an existing document; skipped duplicate.`);
        return;
      }

      // Conflicting ID with differing content: assign a unique ID to prevent silent overwriting
      finalDocId = `${incomingDoc.id}-imported-${idx + 1}`;
      finalDocTitle = `${incomingDoc.title} (Imported)`;
      docIdRemap.set(incomingDoc.id, finalDocId);
      stats.documentsRenamed++;
      warnings.push(`Document ID collision: Existing document has ID "${incomingDoc.id}". Imported document assigned unique ID "${finalDocId}".`);
    } else {
      stats.documentsAdded++;
    }

    // Process blocks inside this incoming document
    const finalBlocks = incomingDoc.blocks.map(block => {
      let finalBlockId = block.id;
      if (existingBlockIds.has(block.id)) {
        // Collides with a block in an existing document! Remap to prevent cross-document confusion
        finalBlockId = `${finalDocId}_${block.id}`;
        blockIdRemap.set(block.id, finalBlockId);
        stats.blocksRemapped++;
        warnings.push(`Block ID collision: Block "${block.id}" in imported document "${finalDocTitle}" remapped to "${finalBlockId}".`);
      } else {
        existingBlockIds.add(block.id);
      }
      return {
        ...block,
        id: finalBlockId
      };
    });

    mergedDocuments.push({
      ...incomingDoc,
      id: finalDocId,
      title: finalDocTitle,
      blocks: finalBlocks
    });
    existingDocMap.set(finalDocId, mergedDocuments[mergedDocuments.length - 1]);
  });

  // 2. Merge Learning Outcomes
  const mergedOutcomes: LearningOutcome[] = [...existing.learningOutcomes];
  incoming.learningOutcomes.forEach((incomingLo, idx) => {
    let finalLoId = incomingLo.id;

    if (existingOutcomeMap.has(incomingLo.id)) {
      const existingLo = existingOutcomeMap.get(incomingLo.id)!;
      if (existingLo.statement.trim().toLowerCase() === incomingLo.statement.trim().toLowerCase()) {
        stats.outcomesSkipped++;
        return; // Identical outcome already present
      }
      finalLoId = `${incomingLo.id}-imported-${idx + 1}`;
      stats.outcomesRenamed++;
      warnings.push(`Learning outcome ID collision: "${incomingLo.id}" renamed to "${finalLoId}".`);
    } else {
      stats.outcomesAdded++;
    }

    mergedOutcomes.push({
      ...incomingLo,
      id: finalLoId
    });
    existingOutcomeMap.set(finalLoId, mergedOutcomes[mergedOutcomes.length - 1]);
  });

  // 3. Merge Suggestions and update remapped documentId & targetBlockId
  const mergedSuggestions: RefactoringSuggestion[] = [...existing.suggestions];
  incoming.suggestions.forEach((incomingSug, idx) => {
    let finalSugId = incomingSug.id;
    if (existingSugIds.has(incomingSug.id)) {
      finalSugId = `${incomingSug.id}-imported-${idx + 1}`;
      stats.suggestionsRenamed++;
      warnings.push(`Suggestion ID collision: "${incomingSug.id}" renamed to "${finalSugId}".`);
    } else {
      stats.suggestionsAdded++;
    }

    // Remap documentId if parent document was remapped
    const targetDocId = incomingSug.documentId ? (docIdRemap.get(incomingSug.documentId) || incomingSug.documentId) : undefined;
    // Remap targetBlockId if target block was remapped
    const targetBlockId = blockIdRemap.get(incomingSug.targetBlockId) || incomingSug.targetBlockId;

    mergedSuggestions.push({
      ...incomingSug,
      id: finalSugId,
      documentId: targetDocId,
      targetBlockId
    });
    existingSugIds.add(finalSugId);
  });

  // 4. Preserve existing comparisons
  const candidateDataset: CombinedDataset = {
    ...existing,
    documents: mergedDocuments,
    contentBlocks: mergedDocuments.flatMap(d => d.blocks),
    learningOutcomes: mergedOutcomes,
    suggestions: mergedSuggestions,
    comparisons: existing.comparisons
  };

  const { dataset: verifiedDataset, warnings: integrityWarnings } = repairAndValidateIntegrity(candidateDataset);
  warnings.push(...integrityWarnings);

  return {
    dataset: verifiedDataset,
    warnings,
    stats
  };
}

/**
 * Performs rigorous runtime schema validation on an arbitrary object.
 */
export function validateDataset(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Input data must be a valid non-null JSON object.'],
      warnings: []
    };
  }

  const raw = data as Record<string, unknown>;

  // Check documents
  if (!Array.isArray(raw.documents)) {
    errors.push('Missing or invalid "documents" field: expected an array.');
  } else {
    raw.documents.forEach((doc: unknown, i: number) => {
      if (!doc || typeof doc !== 'object') {
        errors.push(`Document at index ${i} is not a valid object.`);
        return;
      }
      const d = doc as Record<string, unknown>;
      if (typeof d.id !== 'string' || !d.id.trim()) {
        errors.push(`Document at index ${i} is missing a valid string "id".`);
      }
      if (typeof d.title !== 'string') {
        errors.push(`Document at index ${i} is missing a string "title".`);
      }
      if (typeof d.version !== 'string') {
        errors.push(`Document at index ${i} is missing a string "version".`);
      }
      if (!Array.isArray(d.blocks)) {
        errors.push(`Document "${d.title || d.id || i}" has missing or invalid "blocks" array.`);
      } else {
        d.blocks.forEach((block: unknown, bIdx: number) => {
          if (!block || typeof block !== 'object') {
            errors.push(`Document "${d.id}" has invalid block at index ${bIdx}.`);
            return;
          }
          const b = block as Record<string, unknown>;
          if (typeof b.id !== 'string' || !b.id.trim()) {
            errors.push(`Document "${d.id}" block ${bIdx} is missing a valid "id".`);
          }
          if (typeof b.type !== 'string' || !VALID_BLOCK_TYPES.has(b.type)) {
            errors.push(`Document "${d.id}" block "${b.id || bIdx}" has invalid type "${b.type}".`);
          }
          if (typeof b.content !== 'string') {
            errors.push(`Document "${d.id}" block "${b.id || bIdx}" is missing string "content".`);
          }
        });
      }
    });
  }

  // Check learningOutcomes
  if (raw.learningOutcomes !== undefined && !Array.isArray(raw.learningOutcomes)) {
    errors.push('Optional field "learningOutcomes" must be an array if provided.');
  } else if (Array.isArray(raw.learningOutcomes)) {
    raw.learningOutcomes.forEach((lo: unknown, i: number) => {
      if (!lo || typeof lo !== 'object') {
        errors.push(`Learning outcome at index ${i} is invalid.`);
        return;
      }
      const l = lo as Record<string, unknown>;
      if (typeof l.id !== 'string') errors.push(`Learning outcome ${i} is missing "id".`);
      if (typeof l.statement !== 'string') errors.push(`Learning outcome ${i} is missing "statement".`);
      if (typeof l.level !== 'string' || !VALID_OUTCOME_LEVELS.has(l.level)) {
        errors.push(`Learning outcome ${i} has invalid Bloom's level "${l.level}".`);
      }
    });
  }

  // Check suggestions
  if (raw.suggestions !== undefined && !Array.isArray(raw.suggestions)) {
    errors.push('Optional field "suggestions" must be an array if provided.');
  } else if (Array.isArray(raw.suggestions)) {
    raw.suggestions.forEach((sug: unknown, i: number) => {
      if (!sug || typeof sug !== 'object') {
        errors.push(`Suggestion at index ${i} is invalid.`);
        return;
      }
      const s = sug as Record<string, unknown>;
      if (typeof s.id !== 'string') errors.push(`Suggestion ${i} is missing "id".`);
      if (typeof s.targetBlockId !== 'string') errors.push(`Suggestion ${i} is missing "targetBlockId".`);
      if (typeof s.originalContent !== 'string') errors.push(`Suggestion ${i} is missing "originalContent".`);
      if (typeof s.suggestedContent !== 'string') errors.push(`Suggestion ${i} is missing "suggestedContent".`);
      if (typeof s.rationale !== 'string') errors.push(`Suggestion ${i} is missing "rationale".`);
      if (typeof s.status !== 'string' || !VALID_SUGGESTION_STATUSES.has(s.status)) {
        errors.push(`Suggestion ${i} has invalid status "${s.status}".`);
      }
      if (s.type && (typeof s.type !== 'string' || !VALID_SUGGESTION_TYPES.has(s.type))) {
        warnings.push(`Suggestion ${i} has non-standard type "${s.type}".`);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Migrate and verify referential integrity
  const { dataset: migratedDataset, migrated } = migrateDataset(raw);
  if (migrated) {
    warnings.push(`Dataset automatically migrated to schemaVersion ${CURRENT_SCHEMA_VERSION}.`);
  }

  const { dataset: verifiedDataset, warnings: integrityWarnings } = repairAndValidateIntegrity(migratedDataset);
  warnings.push(...integrityWarnings);

  return {
    valid: true,
    errors: [],
    warnings,
    dataset: verifiedDataset
  };
}

/**
 * Safely migrates raw data (including legacy v0 format) to current CombinedDataset schema.
 */
export function migrateDataset(raw: Record<string, unknown>): {
  dataset: CombinedDataset;
  migrated: boolean;
} {
  let migrated = false;

  const schemaVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (schemaVersion < CURRENT_SCHEMA_VERSION) {
    migrated = true;
  }

  const documents = (raw.documents as ContentDocument[] || []).map(doc => ({
    ...doc,
    blocks: (doc.blocks || []).map(b => ({
      ...b,
      tags: Array.isArray(b.tags) ? b.tags : []
    }))
  }));

  const learningOutcomes = (raw.learningOutcomes as LearningOutcome[] || []);
  const suggestions = (raw.suggestions as RefactoringSuggestion[] || []);
  const comparisons = (raw.comparisons as ComparisonResult[] || []);

  const dataset: CombinedDataset = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : undefined,
    documents,
    contentBlocks: documents.flatMap(d => d.blocks), // source of truth projection
    learningOutcomes,
    suggestions,
    comparisons,
    aiInvolvement: typeof raw.aiInvolvement === 'string' ? raw.aiInvolvement : '',
    assumptions: typeof raw.assumptions === 'string' ? raw.assumptions : '',
    risks: typeof raw.risks === 'string' ? raw.risks : '',
    rationale: typeof raw.rationale === 'string' ? raw.rationale : '',
    reviewNotes: typeof raw.reviewNotes === 'string' ? raw.reviewNotes : ''
  };

  return { dataset, migrated };
}
