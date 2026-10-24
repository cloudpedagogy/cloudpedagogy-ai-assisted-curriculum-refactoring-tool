/**
 * Comprehensive standard English stopwords for curriculum text filtering.
 */
export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours'
]);

/**
 * Normalizes text and extracts tokens, preserving numbers and hyphens.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .trim();
  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * Extracts meaningful content tokens by filtering stopwords,
 * deliberately retaining short pedagogical terms (e.g. plan, code, risk, data, test, team, bias, draw).
 */
export function extractContentTokens(text: string): string[] {
  const allTokens = tokenize(text);
  return allTokens.filter(t => !STOPWORDS.has(t));
}

/**
 * Calculates bounded Jaccard similarity (0.0 to 1.0) between two strings based on unique token sets.
 * Gracefully handles identical strings, empty strings, and repeated words.
 */
export function calculateTokenJaccard(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;

  const tokens1 = extractContentTokens(s1);
  const tokens2 = extractContentTokens(s2);

  if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersectionCount = 0;
  set1.forEach(token => {
    if (set2.has(token)) intersectionCount++;
  });

  const unionSize = new Set([...set1, ...set2]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0.0;
}
