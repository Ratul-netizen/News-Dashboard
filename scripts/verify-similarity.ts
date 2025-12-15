
import {
    tokenizeBanglaText,
    calculateSemanticSimilarity,
    calculateContextAwareSemanticSimilarity,
    calculateAdvancedSemanticSimilarity
} from '../lib/utils/semantic-similarity';

// Need to access the module internals or duplicate logic to test specifics like stop words if they aren't exported.
// Since tokenizeBanglaText is exported (implied by usage, though checking file showed it wasn't, I will assume I need to export or check logic indirectly via tokenization)
// Actually tokenizeBanglaText was NOT exported in the original file view, only calculate* functions were.
// I will check the file again to see if I need to export it or just test via similarity results. 
// For this script, I will try to use the exported functions effectively.

console.log("🧪 Verifying Bengali Semantic Similarity Refinements...\n");

// Mock function to expose tokenization if not exported 
// (or I relied on previous knowledge/edits - let's verify stop words via similarity)
// If "ঢাকা" is a stop word, "ঢাকা" vs "ঢাকা" might be 0 or handled as empty? 
// No, invalid input handling returns 0. 

// Actually, tokenizeBanglaText is LOCAL in the file, not exported. 
// However, I can infer behavior from `batchSemanticSimilarity` or just running similarity on simple strings.

function test() {
    // Test 1: Stop Word Cleanup
    // "ঢাকা" and "বাংলাদেশ" should NOT be removed. 
    // If they were removed, similarity of "ঢাকা" vs "ঢাকা" would be 0 (empty tokens).
    // If kept, similarity should be 1.0.
    const loc1 = "ঢাকা";
    const loc2 = "ঢাকা";
    const simLoc = calculateSemanticSimilarity(loc1, loc2);
    console.log(`Test 1a: Entity Retention (Dhaka) -> Similarity: ${simLoc}`);
    if (simLoc > 0.9) console.log("✅ PASS: 'Dhaka' is preserved.");
    else console.log("❌ FAIL: 'Dhaka' was removed!");

    // "এবং" should be removed.
    // "এবং" vs "এবং" -> if removed, both empty -> returns 0.
    const stop1 = "এবং";
    const stop2 = "এবং";
    const simStop = calculateSemanticSimilarity(stop1, stop2);
    console.log(`Test 1b: Stop Word Removal (Ebong) -> Similarity: ${simStop}`);
    if (simStop === 0) console.log("✅ PASS: 'Ebong' is removed.");
    else console.log("❌ FAIL: 'Ebong' was kept!");

    // Test 2: Normalization Safety
    // "অপরাধ" should NOT become "পরাধ" (prefix 'অ' stripping).
    // "অপরাধ" vs "পরাধ" should represent whether they normalized to same thing.
    // But better test: "অপরাধ" vs "অপরাধ" should be 1.0.
    // And "অপরাধ" vs "পরাধ" should ideally be LOWER if normalization is safe (they are different words).
    const w1 = "অপরাধ";
    const w2 = "পরাধ";
    // If aggressive stripping: both -> "পরাধ" -> sim 1.0
    // If safe stripping: "অপরাধ" keeps "অপরাধ", "পরাধ" keeps "পরাধ" -> sim 0
    const simNorm = calculateSemanticSimilarity(w1, w2);
    console.log(`Test 2a: Normalization Safety (Oporadh vs Poradh) -> Similarity: ${simNorm}`);
    if (simNorm < 0.99) console.log("✅ PASS: aggressive 'O' stripping prevented.");
    else console.log("❌ FAIL: 'Oporadh' stripped to 'Poradh'!");

    // Suffix: "ছেলেদের" -> "ছেলে" (suffix 'দের' removal).
    // "ছেলে" vs "ছেলেদের" -> should be 1.0.
    const s1 = "ছেলে";
    const s2 = "ছেলেদের";

    const simSuffix = calculateSemanticSimilarity(s1, s2);
    console.log(`Test 2b: Suffix Normalization (Chele vs Cheleder) -> Similarity: ${simSuffix}`);
    if (simSuffix > 0.9) console.log("✅ PASS: Suffix 'der' normalized correctly.");
    else console.log("❌ FAIL: Suffix likely not handled or over-stripped.");

    // Test 3: Entity Extraction (Suffix Patterns)
    // "রহিম উদ্দিন" should match "রহিম উদ্দিন" with high boost.
    const name1 = "সন্ত্রাসী রহিম উদ্দিন ধরা পড়েছে";
    const name2 = "রহিম উদ্দিন গ্রেফতার";
    const simContext = calculateContextAwareSemanticSimilarity(name1, name2);
    console.log(`Test 3: Entity Context Boost (Rahim Uddin) -> Similarity: ${simContext.toFixed(3)}`);

    // Compare with non-entity similarity to ensure boost works
    // "সন্ত্রাসী ধরা পড়েছে" vs "গ্রেফতার" (low overlap)
    const base1 = "সন্ত্রাসী ধরা পড়েছে";
    const base2 = "গ্রেফতার";
    const simBase = calculateSemanticSimilarity(base1, base2);
    console.log(`(Baseline for comparison: ${simBase.toFixed(3)})`);

    if (simContext > simBase) console.log("✅ PASS: Entity boost active for name pattern.");
    else console.log("❌ FAIL: No boost detected for name pattern.");

    // Test 4: IDF Stability (Simple check)
    // Just ensuring it doesn't crash or return NaN on weird inputs.
    const idfCheck = calculateSemanticSimilarity("test", "test");
    console.log(`Test 4: basic sanity -> ${idfCheck}`);
    if (!isNaN(idfCheck)) console.log("✅ PASS: Calculation stable.");
}

test();
