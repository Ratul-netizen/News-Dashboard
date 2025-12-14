// Logic copied from lib/utils/text-similarity.ts for testing
function calculateJaccardSimilarity(text1, text2) {
    if (!text1 || !text2) return 0

    // Clean text: lowercase, remove punctuation (keeping unicode letters/marks/numbers), reduce whitespace
    // Using \p{L} for letters, \p{M} for marks (vowels), \p{N} for numbers
    const clean = (text) => text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim()

    const s1 = clean(text1)
    const s2 = clean(text2)

    console.log(`Debug S1: [${s1}]`)
    console.log(`Debug S2: [${s2}]`)

    if (s1 === s2) return 1.0
    if (s1.length < 2 || s2.length < 2) return 0.0

    // Create bigrams function
    const getBigrams = (str) => {
        const bigrams = new Map()
        for (let i = 0; i < str.length - 1; i++) {
            const bigram = str.substring(i, i + 2)
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1)
        }
        return bigrams
    }

    const bigrams1 = getBigrams(s1)
    const bigrams2 = getBigrams(s2)

    let intersection = 0

    // Calculate size
    let len1 = 0
    bigrams1.forEach(count => len1 += count)

    let len2 = 0
    bigrams2.forEach(count => len2 += count)

    // Calculate intersection count
    bigrams1.forEach((count, bigram) => {
        if (bigrams2.has(bigram)) {
            intersection += Math.min(count, bigrams2.get(bigram))
        }
    })

    // Dice coefficient: 2 * (intersection) / (size1 + size2)
    return (2.0 * intersection) / (len1 + len2)
}

const text1 = "শাহবাগে নিরাপত্তা বাড়াতে পুলিশের বেরিকেড নিয়ে আসা হচ্ছে";
const text2 = "শাহবাগে নিরাপত্তা বাড়াতে পুলিশের বেরিকেড"; // Similar
const text3 = "রাজশাহীতে বিএনপির দুই গ্রুপের মধ্যে সংঘর্ষ"; // Dissimilar
const text4 = "রাজশাহীতে বিএনপির"; // Substring of 3

console.log("--- Testing Bengali Text Cleaning & Similarity (Pure JS) ---");

console.log(`\n1 vs 2 (Expected High): ${calculateJaccardSimilarity(text1, text2)}`);
console.log(`\n1 vs 3 (Expected Low/Zero): ${calculateJaccardSimilarity(text1, text3)}`);
console.log(`\n3 vs 4 (Expected High): ${calculateJaccardSimilarity(text3, text4)}`);
