/**
 * Semantic similarity utilities for Bangla text
 * Uses multilingual embeddings for better semantic understanding
 */

// Simple TF-IDF based semantic similarity for Bangla
// In production, this could be replaced with transformer embeddings

// Common Bangla stop words for TF-IDF
// Common Bangla stop words for TF-IDF (Entities/Time words removed for semantic purity)
const BANGLA_STOP_WORDS = new Set([
  'এবং', 'অথবা', 'কিন্তু', 'তবে', 'যদি', 'যেহেতু', 'কারণ',
  'যে', 'সে', 'এই', 'সেই', 'সেটা', 'ওটা', 'তার', 'তাদের', 'তারা',
  'আমি', 'আমরা', 'তুমি', 'তোমরা', 'আপনি', 'আপনারা', 'তিনি',
  'হবে', 'ছিল', 'আছে', 'নেই', 'হয়', 'হয়নি', 'করে', 'করতে', 'করবে',
  'একটি', 'একজন', 'কিছু', 'অনেক', 'সব', 'সবাই', 'আরও', 'অন্য',
  'পরে', 'আগে', 'সাথে', 'দিয়ে', 'থেকে', 'পর্যন্ত', 'ভিতরে',
  'বাইরে', 'উপরে', 'নিচে', 'সামনে', 'পেছনে', 'বিভিন্ন', 'অনুযায়ী',
  'জন্য', 'সম্পর্কে', 'বিষয়ে', 'নিয়ে', 'সঙ্গে', 'বিপক্ষে', 'পক্ষে',
  'খুব', 'অত্যন্ত', 'বেশ', 'অনেকাংশে', 'প্রায়', 'মোটামুটি', 'সম্পূর্ণ',
  'বলেন', 'বললেন', 'জানান', 'জানিয়েছেন', 'বলা', 'হয়েছে', 'পাওয়া',
  'শুরু', 'শেষ', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'পর',
  'এলাকা', 'জায়গা', 'স্থান'
])

// Common Bangla prefixes and suffixes to normalize
const BANGLA_PREFIXES = ['অ', 'আ', 'অন', 'অতি', 'বদ', 'সু', 'দু', 'তিন', 'চার', 'পাঁচ']
const BANGLA_SUFFIXES = ['গুলো', 'গুলি', 'গুলোর', 'গুলির', 'টা', 'টি', 'টার', 'টির', 'দের', 'এর', 'এ', 'র', 'কে', 'তে', 'য়ে']

/**
 * Clean and tokenize Bangla text for semantic analysis
 */
export function tokenizeBanglaText(text: string): string[] {
  return text
    .toLowerCase()
    // Remove punctuation and numbers
    .replace(/[^\u0980-\u09FF\s]/g, ' ')
    // Reduce multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    // Filter out stop words and very short tokens
    .filter(word => word.length > 2 && !BANGLA_STOP_WORDS.has(word))
    // Normalize common prefixes and suffixes
    .map(word => {
      let normalized = word

      // Sort suffixes by length (descending) to match longest first
      // Normalized must remain at least 3 chars long after stripping
      const sortedSuffixes = [...BANGLA_SUFFIXES].sort((a, b) => b.length - a.length)

      for (const suffix of sortedSuffixes) {
        // Safety: Suffix stripping requires remaining word length >= 3
        // Extra Safety: Single-char suffixes (like 'এ', 'র') require remaining length >= 4
        // to avoid stripping semantic vowels (e.g., 'ছেলে' -> 'ছেল' ❌)
        const minLength = suffix.length === 1 ? 4 : 3

        if (normalized.endsWith(suffix) && normalized.length - suffix.length >= minLength) {
          // console.log(`STRIP: ${normalized} -> ${suffix} -> ${normalized.slice(0, -suffix.length)}`);
          normalized = normalized.slice(0, -suffix.length)
          break
        }
      }

      // Remove common prefixes
      for (const prefix of BANGLA_PREFIXES) {
        // Extra Safety: Single-char prefixes (like 'অ', 'আ') require remaining length >= 5
        // (e.g., 'অপরাধ' -> 'পরাধ' ❌, 'অজানা' -> 'জানা' ✅)
        const minLength = prefix.length === 1 ? 5 : 3

        if (normalized.startsWith(prefix) && normalized.length - prefix.length >= minLength) {
          normalized = normalized.slice(prefix.length)
          break
        }
      }
      return normalized
    })
    .filter(word => word.length > 1)
}

/**
 * Calculate TF-IDF vectors for documents
 */
function calculateTFIDF(documents: string[]): Map<string, number>[] {
  // Calculate document frequency for each term
  const docFreq = new Map<string, number>()
  const totalDocs = documents.length

  documents.forEach(doc => {
    const terms = new Set(tokenizeBanglaText(doc))
    terms.forEach(term => {
      docFreq.set(term, (docFreq.get(term) || 0) + 1)
    })
  })

  // Calculate TF-IDF for each document
  return documents.map(doc => {
    const terms = tokenizeBanglaText(doc)
    const termFreq = new Map<string, number>()
    const totalTerms = terms.length

    // Calculate term frequency
    terms.forEach(term => {
      termFreq.set(term, (termFreq.get(term) || 0) + 1)
    })

    // Calculate TF-IDF
    const tfidf = new Map<string, number>()
    termFreq.forEach((tf, term) => {
      const df = docFreq.get(term) || 0
      // Smoothed IDF: log((N+1)/(df+1)) + 1
      // Prevents division by zero and stabilizes scores for rare terms
      const idf = Math.log((totalDocs + 1) / (df + 1)) + 1
      tfidf.set(term, (tf / totalTerms) * idf)
    })

    return tfidf
  })
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  // Calculate dot product
  for (const [term, value1] of vec1) {
    const value2 = vec2.get(term) || 0
    dotProduct += value1 * value2
    norm1 += value1 * value1
  }

  // Calculate norms
  for (const value of vec2.values()) {
    norm2 += value * value
  }

  if (norm1 === 0 || norm2 === 0) return 0

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Calculate semantic similarity between two Bangla texts
 * Uses TF-IDF with cosine similarity
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  const documents = [text1, text2]
  const tfidfVectors = calculateTFIDF(documents)

  return cosineSimilarity(tfidfVectors[0], tfidfVectors[1])
}

/**
 * Advanced semantic similarity with n-grams and word embeddings approximation
 */
export function calculateAdvancedSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  // Basic TF-IDF similarity
  const tfidfSim = calculateSemanticSimilarity(text1, text2)

  // Extract character n-grams for local similarity
  const ngrams1 = getCharacterNGrams(text1.toLowerCase(), 3)
  const ngrams2 = getCharacterNGrams(text2.toLowerCase(), 3)

  const ngramSim = calculateNGramSimilarity(ngrams1, ngrams2)

  // Extract word-level features
  const words1 = new Set(tokenizeBanglaText(text1))
  const words2 = new Set(tokenizeBanglaText(text2))

  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  const jaccardSim = union.size > 0 ? intersection.size / union.size : 0

  // Weighted combination
  return (tfidfSim * 0.5) + (ngramSim * 0.3) + (jaccardSim * 0.2)
}

/**
 * Extract character n-grams from text
 */
function getCharacterNGrams(text: string, n: number): Map<string, number> {
  const ngrams = new Map<string, number>()
  const cleanText = text.replace(/\s+/g, ' ').trim()

  for (let i = 0; i <= cleanText.length - n; i++) {
    const ngram = cleanText.substring(i, i + n)
    if (/[অ-হাড়ৎ]/.test(ngram)) { // Only Bangla characters
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1)
    }
  }

  return ngrams
}

/**
 * Calculate n-gram similarity
 */
function calculateNGramSimilarity(ngrams1: Map<string, number>, ngrams2: Map<string, number>): number {
  let intersection = 0
  let union = 0

  // Calculate intersection
  for (const [ngram, count1] of ngrams1) {
    const count2 = ngrams2.get(ngram) || 0
    intersection += Math.min(count1, count2)
  }

  // Calculate union
  const allNgrams = new Set([...ngrams1.keys(), ...ngrams2.keys()])
  for (const ngram of allNgrams) {
    const count1 = ngrams1.get(ngram) || 0
    const count2 = ngrams2.get(ngram) || 0
    union += Math.max(count1, count2)
  }

  return union > 0 ? intersection / union : 0
}

/**
 * Batch semantic similarity calculation for multiple texts
 */
export function batchSemanticSimilarity(
  primaryText: string,
  candidateTexts: string[]
): Array<{ text: string; similarity: number }> {
  return candidateTexts
    .map(text => ({
      text,
      similarity: calculateAdvancedSemanticSimilarity(primaryText, text)
    }))
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Semantic similarity with context awareness
 * Adjusts similarity based on shared context
 */
export function calculateContextAwareSemanticSimilarity(
  text1: string,
  text2: string,
  contextBoost = 0.1
): number {
  const baseSim = calculateAdvancedSemanticSimilarity(text1, text2)

  // Check if texts share important entities (names, places, etc.)
  const entities1 = extractEntities(text1)
  const entities2 = extractEntities(text2)

  const sharedEntities = entities1.filter(e => entities2.includes(e))
  const entityBoost = sharedEntities.length > 0 ? contextBoost * sharedEntities.length : 0

  return Math.min(1.0, baseSim + entityBoost)
}

/**
 * Extract potential entities (names, places, organizations) from text
 */
function extractEntities(text: string): string[] {
  const entities: string[] = []

  // Look for common Bangla name patterns (First Last)
  // Extracts full name phrase like "রহিম উদ্দিন" based on suffix presence
  const namePatterns = text.match(/([অ-হাড়ৎ]{2,15})\s+(?:খান|উদ্দিন|হোসেন|আহমেদ|চৌধুরী|সরকার|মিয়া|বেগম|হক|ইসলাম|রহমান)\b/g) || []
  entities.push(...namePatterns)

  return [...new Set(entities)] // Remove duplicates
}