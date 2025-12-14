
const { calculateJaccardSimilarity } = require('./lib/utils/text-similarity');

const text1 = "শাহবাগে নিরাপত্তা বাড়াতে পুলিশের বেরিকেড নিয়ে আসা হচ্ছে";
const text2 = "শাহবাগে নিরাপত্তা বাড়াতে পুলিশের বেরিকেড"; // Similar
const text3 = "রাজশাহীতে বিএনপির দুই গ্রুপের মধ্যে সংঘর্ষ"; // Dissimilar (different city/topic)
const text4 = ""; // Empty

console.log("--- Testing Bengali Text Cleaning & Similarity ---");

console.log(`1 vs 2 (Similar): ${calculateJaccardSimilarity(text1, text2)}`);
console.log(`1 vs 3 (Dissimilar): ${calculateJaccardSimilarity(text1, text3)}`);
console.log(`1 vs 4 (Empty): ${calculateJaccardSimilarity(text1, text4)}`);

// function manually copied here to test if the file isn't loading correctly or regex invalid
function localClean(text: string) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

console.log("\n--- Debugging Clean Function ---");
console.log(`Original: "${text1}"`);
console.log(`Cleaned:  "${localClean(text1)}"`);
console.log(`Original: "${text3}"`);
console.log(`Cleaned:  "${localClean(text3)}"`);
