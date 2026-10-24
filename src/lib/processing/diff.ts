export interface DiffChunk {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

/**
 * Splits text into words while keeping whitespace delimiters intact for precise reconstruction.
 */
function splitWords(text: string): string[] {
  if (!text) return [];
  const words = text.match(/\S+|\s+/g);
  return words || [];
}

/**
 * Computes word-level diff using Longest Common Subsequence (LCS).
 */
export function computeWordDiff(original: string, revised: string): DiffChunk[] {
  if (original === revised) {
    return [{ type: 'unchanged', text: original }];
  }

  const origWords = splitWords(original);
  const revWords = splitWords(revised);

  const n = origWords.length;
  const m = revWords.length;

  if (n === 0) {
    return [{ type: 'added', text: revised }];
  }
  if (m === 0) {
    return [{ type: 'removed', text: original }];
  }

  // DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (origWords[i] === revWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to assemble diff tokens
  const rawChunks: DiffChunk[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === revWords[j - 1]) {
      rawChunks.push({ type: 'unchanged', text: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChunks.push({ type: 'added', text: revWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawChunks.push({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  rawChunks.reverse();

  // Coalesce consecutive chunks of the same type
  const coalesced: DiffChunk[] = [];
  for (const chunk of rawChunks) {
    if (coalesced.length > 0 && coalesced[coalesced.length - 1].type === chunk.type) {
      coalesced[coalesced.length - 1].text += chunk.text;
    } else {
      coalesced.push({ ...chunk });
    }
  }

  return coalesced;
}
