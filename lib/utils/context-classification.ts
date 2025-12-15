/**
 * Incident context classification for Bangla news
 * Classifies posts into incident categories for better grouping
 */

// Incident context buckets with Bangla keywords using role-based vocabulary structure
// Incident context buckets with Bangla keywords using enhanced role-based vocabulary structure
const INCIDENT_CONTEXTS = {
  enforced_disappearance: {
    keywords: {
      core_phrases: [
        'গুমের অভিযোগ', 'জোরপূর্বক গুম', 'গুম হওয়া', 'গুম করার অভিযোগ',
        'নিখোঁজ করার অভিযোগ', 'আটকে নিয়ে যাওয়া', 'গুমের শিকার',
        'জোর করে তুলে নেওয়া', 'বলপূর্বক গুম', 'গুম করা'
      ],
      core_words: ['গুম', 'নিখোঁজ', 'উধাও', 'নিপাত', 'অন্তর্ধান'],
      weak_words: [
        'পরিবারের দাবি', 'খোঁজ পাওয়া যায়নি', 'নিখোঁজ ব্যক্তি',
        'সন্ধান', 'অনুপস্থিত', 'হারিয়ে যাওয়া'
      ],
      soft_exclusion_words: [
        'সিনেমা', 'নাটক', 'বিনোদন', 'গল্প', 'উপন্যাস'
      ],
      hard_exclusion_words: [
        'খেলা', 'টুর্নামেন্ট', 'গোল', 'উইকেট', 'স্কোর', 'ম্যাচ', 'লিগ'
      ]
    },
    weight: 0.35
  },

  sexual_crime: {
    keywords: {
      core_phrases: [
        'ধর্ষণের অভিযোগ', 'যৌন নিপীড়ন', 'যৌন হয়রানি', 'ধর্ষণের ঘটনা',
        'যৌন নির্যাতন', 'ধর্ষণের শিকার', 'ধর্ষণ মামলা', 'যৌন অপরাধ',
        'নারী ও শিশু নির্যাতন'
      ],
      core_words: ['ধর্ষণ', 'যৌন', 'নিপীড়ন', 'হয়রানি', 'অপরাধ', 'শ্লীলতাহানি'],
      weak_words: ['আপত্তিকর', 'কুৎসিত', 'অশালীন', 'লাঞ্ছিত'],
      soft_exclusion_words: [
        'সম্পর্ক', 'বিয়ে', 'বিবাহ', 'প্রেম', 'প্রেমিক', 'প্রেমিকা',
        'ডেটিং', 'সম্মতি', 'স্বামী', 'স্ত্রী'
      ],
      hard_exclusion_words: []
    },
    weight: 0.35
  },

  murder: {
    keywords: {
      core_phrases: [
        'খুনের অভিযোগ', 'হত্যাকাণ্ড', 'পরিকল্পিত হত্যা', 'গণহত্যা',
        'আততায়ীর হামলা', 'কিলিং', 'হত্যা মামলা', 'খুনের ঘটনা',
        'খুন করা', 'গলা কেটে হত্যা'
      ],
      core_words: ['হত্যা', 'খুন', 'কিলিং', 'আততায়ী', 'খুনী', 'হত্যাকারী', 'লাশ', 'মরদেহ'],
      weak_words: ['মৃত্যু', 'নিহত', 'মারা যাওয়া', 'প্রাণহানি', 'রক্তাক্ত'],
      soft_exclusion_words: [
        'সড়ক দুর্ঘটনা', 'বিমান দুর্ঘটনা', 'বন্যা', 'ভূমিকম্প', 'আগুন'
      ],
      hard_exclusion_words: [
        'আত্মহত্যা', 'সিনেমা', 'নাটক'
      ]
    },
    weight: 0.35
  },

  financial_crime: {
    keywords: {
      core_phrases: [
        'অর্থপাচারের অভিযোগ', 'দুর্নীতি মামলা', 'জালিয়াতি', 'অর্থ আত্মসাৎ',
        'ঘুষ কেলেঙ্কারি', 'ঋণ জালিয়াতি', 'ব্যাংক জালিয়াতি', 'কর ফাঁকি',
        'অবৈধ সম্পদ', 'মানি লন্ডারিং'
      ],
      core_words: ['অর্থপাচার', 'দুর্নীতি', 'জালিয়াতি', 'আত্মসাৎ', 'ঘুষ', 'দুর্নীতিবাজ', 'লন্ডারিং'],
      weak_words: ['অনিয়ম', 'অবহেলা', 'স্বেচ্ছাচার', 'অব্যবস্থাপনা', 'খেলাপি'],
      soft_exclusion_words: [
        'ব্যবসা', 'বাণিজ্য', 'বিনিয়োগ', 'লাভ', 'লোকসান', 'মুনাফা',
        'শেয়ারবাজার', 'ব্যাংক', 'বীমা'
      ],
      hard_exclusion_words: []
    },
    weight: 0.3
  },

  threat_extortion: {
    keywords: {
      core_phrases: [
        'চাঁদাবাজির অভিযোগ', 'হুমকি দেওয়া', 'হত্যার হুমকি', 'জিম্মি করা',
        'মুক্তিপণ দাবি', 'চাঁদা আদায়', 'বলপূর্বক চাঁদা', 'জিম্মিকরণ',
        'ভয়ভীতি প্রদর্শন'
      ],
      core_words: ['চাঁদাবাজি', 'হুমকি', 'জিম্মি', 'মুক্তিপণ', 'বলপূর্বক', 'চাঁদা', 'ভয়ভীতি'],
      weak_words: ['ভয়', 'আতঙ্ক', 'চাপ', 'চাপাচাপি', 'দাবি'],
      soft_exclusion_words: [
        'ব্যবসায়িক', 'লেনদেন', 'চুক্তি', 'আলোচনা', 'দরকষাকষি',
        'সমঝোতা', 'বাণিজ্যিক'
      ],
      hard_exclusion_words: []
    },
    weight: 0.3
  },

  medical: {
    keywords: {
      core_phrases: [
        'ভেন্টিলেটরে চিকিৎসা', 'নিউরো সার্জারি', 'ক্রিটিক্যাল কেয়ার',
        'আইসিইউতে ভর্তি', 'অস্ত্রোপচারের পর', 'চিকিৎসাধীন', 'মৃত্যুর কারণ'
      ],
      core_words: [
        'মস্তিষ্ক', 'ভেন্টিলেটর', 'হাসপাতাল', 'নিউরো', 'চিকিৎসক', 'ডাক্তার',
        'চিকিৎসা', 'ঔষধ', 'অস্ত্রোপচার', 'আইসিইউ', 'ক্রিটিক্যাল', 'স্বাস্থ্য', 'রোগ'
      ],
      weak_words: ['মৃত্যু', 'নিহত', 'আহত', 'ব্যথা', 'ক্ষত', 'ক্ষতিগ্রস্ত', 'মারাত্মক', 'জখম', 'শরীর', 'রক্ত'],
      soft_exclusion_words: ['যুদ্ধ', 'সন্ত্রাস', 'দুর্ঘটনা', 'বিস্ফোরণ', 'আক্রমণ'],
      hard_exclusion_words: []
    },
    weight: 0.3
  },

  shooting_attack: {
    keywords: {
      core_phrases: [
        'এলোমেলো গুলিবর্ষণ', 'সন্ত্রাসী হামলা', 'বন্দুকযুদ্ধ', 'গুলি চালানো',
        'গুলিবিদ্ধ', 'ছুরিকাঘাতের ঘটনা', 'আততায়ী হামলা'
      ],
      core_words: ['গুলি', 'গুলিবর্ষণ', 'বন্দুক', 'পিস্তল', 'রিভলবার', 'ছুরিকাঘাত', 'অস্ত্র'],
      weak_words: [
        'হামলা', 'আক্রমণ', 'হামলাকারী', 'সন্ত্রাসী', 'দুর্বৃত্ত', 'ক্ষয়ক্ষতি',
        'আতঙ্ক', 'প্রাণনাশ', 'হত্যা', 'খুন', 'হত্যাকাণ্ড', 'জখম', 'নির্যাতন', 'মারধর'
      ],
      soft_exclusion_words: ['অনুশীলন', 'প্রশিক্ষণ', 'ক্রীড়া', 'প্রতিযোগিতা', 'অনুষ্ঠান'],
      hard_exclusion_words: ['শ্যুটিং', 'অলিম্পিক', 'সিনেমা']
    },
    weight: 0.3
  },

  investigation: {
    keywords: {
      core_phrases: [
        'তদন্ত শুরু', 'মামলা দায়ের', 'পুলিশি তদন্ত', 'আদালতের নির্দেশ',
        'জিজ্ঞাসাবাদ', 'গ্রেপ্তার করা', 'অভিযোগ পাওয়া', 'তদন্তাধীন',
        'রিমান্ড আবেদন'
      ],
      core_words: [
        'সন্দেহভাজন', 'গ্রেপ্তার', 'তদন্ত', 'মামলা',
        'থানা', 'পুলিশ', 'ডিবি', 'সিআইডি',
        'আদালত', 'বিচারক', 'জামিন', 'কারাদণ্ড', 'সাজা', 'রিমান্ড'
      ],
      weak_words: ['জিজ্ঞাসাবাদ', 'আটক', 'অভিযুক্ত', 'অভিযোগ', 'সাক্ষী', 'প্রমাণ', 'অনুসন্ধান', 'অভিযান'],
      soft_exclusion_words: ['খেলা', 'বিনোদন', 'অনুষ্ঠান', 'অনুশীলন', 'প্রতিযোগিতা'],
      hard_exclusion_words: ['সিনেমা', 'নাটক']
    },
    weight: 0.25
  },

  war: {
    keywords: {
      core_phrases: [
        'সামরিক অভিযান', 'সীমান্ত সংঘর্ষ', 'বিমান হামলা', 'গোলাবর্ষণ',
        'যুদ্ধবিমান', 'সামরিক অপারেশন', 'আকাশসীমা লঙ্ঘন'
      ],
      core_words: [
        'সীমান্ত', 'ড্রোন', 'সেনা', 'সৈন্য', 'সামরিক', 'যুদ্ধ',
        'যুদ্ধবিমান', 'ট্যাঙ্ক', 'গোলাবর্ষণ', 'বিস্ফোরণ', 'মিসাইল'
      ],
      weak_words: ['হামলা', 'আক্রমণ', 'পাল্টাপাল্টি', 'যুদ্ধংদেহী', 'শত্রু', 'আকাশসীমা', 'সীমান্তরক্ষী', 'সেনাবাহিনী'],
      soft_exclusion_words: ['খেলা', 'অনুশীলন', 'প্রশিক্ষণ', 'প্রতিযোগিতা', 'টুর্নামেন্ট'],
      hard_exclusion_words: ['ভিডিও গেম', 'সিনেমা']
    },
    weight: 0.2
  },

  accident: {
    keywords: {
      core_phrases: [
        'সড়ক দুর্ঘটনা', 'বিমান দুর্ঘটনা', 'ট্রেন দুর্ঘটনা', 'অগ্নিকাণ্ড',
        'নিয়ন্ত্রণ হারিয়ে', 'মাথায় আঘাত', 'ছিটকে পড়ে'
      ],
      core_words: [
        'বিমান', 'ইঞ্জিন', 'দুর্ঘটনা', 'সড়ক', 'ট্রেন', 'লঞ্চ',
        'বাস', 'ট্রাক', 'মোটরসাইকেল', 'আগুন', 'অগ্নিকাণ্ড', 'বিস্ফোরণ'
      ],
      weak_words: ['নিয়ন্ত্রণ', 'ছিটকে', 'পড়ে', 'ধ্বংস', 'ক্ষতিগ্রস্ত', 'উদ্ধার', 'আহত', 'নিহত', 'জাহাজ', 'ডুবে', 'ডুবি', 'উল্টে', 'পিছলে'],
      soft_exclusion_words: ['হামলা', 'আক্রমণ', 'যুদ্ধ', 'সন্ত্রাস', 'ইচ্ছাকৃত', 'পরিকল্পিত'],
      hard_exclusion_words: []
    },
    weight: 0.2
  },

  protest: {
    keywords: {
      core_phrases: [
        'বিক্ষোভ মিছিল', 'ধর্মঘট পালন', 'হরতাল আহ্বান', 'প্রতিবাদ সমাবেশ',
        'অবরোধ কর্মসূচি', 'অবস্থান ধর্মঘট', 'শ্রমিক বিক্ষোভ', 'মানববন্ধন'
      ],
      core_words: [
        'বিক্ষোভ', 'আন্দোলন', 'ধর্মঘট', 'হরতাল', 'প্রতিবাদ',
        'মিছিল', 'সমাবেশ', 'সভা', 'সমাবেশস্থল', 'মানববন্ধন'
      ],
      weak_words: ['পুলিশি', 'লাঠিচার্জ', 'টিয়ারগ্যাস', 'কাঁদানে গ্যাস', 'জামিন', 'আটক', 'ছাত্র', 'শ্রমিক', 'কৃষক', 'অবরোধ', 'অবস্থান', 'কর্মসূচি', 'স্লোগান'],
      soft_exclusion_words: ['উৎসব', 'উদযাপন', 'খেলা', 'বিনোদন', 'অনুষ্ঠান'],
      hard_exclusion_words: []
    },
    weight: 0.2
  },

  political: {
    keywords: {
      core_phrases: [
        'নির্বাচনী প্রচারণা', 'ভোটগ্রহণ', 'ফলাফল ঘোষণা', 'জয়-পরাজয়',
        'প্রার্থী নির্বাচন', 'দলীয় মিটিং', 'জোটগঠন'
      ],
      core_words: [
        'নির্বাচন', 'ভোট', 'ইভিএম', 'কেন্দ্র', 'প্রার্থী', 'এমপি',
        'সংসদ', 'সংসদ সদস্য', 'মন্ত্রী', 'প্রধানমন্ত্রী', 'রাষ্ট্রপতি', 'দল'
      ],
      weak_words: ['জোট', 'মিত্র', 'প্রতিপক্ষ', 'আওয়ামী লীগ', 'বিএনপি', 'জাতীয় পার্টি', 'জামায়াত', 'জাসদ', 'ওয়ার্কার্স পার্টি', 'রাজনীতি', 'প্রচারণা', 'প্রতীক', 'জয়-পরাজয়', 'ফলাফল'],
      soft_exclusion_words: ['খেলা', 'বিনোদন', 'অনুষ্ঠান', 'উৎসব', 'ক্রীড়া', 'প্রতিযোগিতা'],
      hard_exclusion_words: []
    },
    weight: 0.15
  }
}

// Event chain relationships - how contexts can evolve
const EVENT_CHAIN_RELATIONS = {
  enforced_disappearance: ['investigation', 'protest'],
  sexual_crime: ['investigation', 'protest'],
  murder: ['investigation', 'protest'],
  financial_crime: ['investigation', 'political'],
  threat_extortion: ['investigation'],
  medical: ['investigation', 'protest'],
  shooting_attack: ['medical', 'investigation'],
  investigation: ['protest', 'political'],
  accident: ['medical', 'investigation'],
  protest: ['shooting_attack', 'investigation'],
  war: ['accident', 'political'],
  political: ['protest', 'investigation']
}

export type IncidentContext = keyof typeof INCIDENT_CONTEXTS

export interface ContextClassification {
  context: IncidentContext
  confidence: number
  keywords: string[]
}

/**
 * Classify a post into incident contexts with enhanced scoring
 */
export function classifyIncidentContext(text: string): ContextClassification[] {
  const results: ContextClassification[] = []
  const lowerText = text.toLowerCase()

  Object.entries(INCIDENT_CONTEXTS).forEach(([context, data]) => {
    // Cast to any to handle the structure transition if TS complains, 
    // but the data structure is consistent now.
    const keywordData = data.keywords

    // Track different types of matches
    const corePhraseMatches = keywordData.core_phrases.filter(phrase =>
      lowerText.includes(phrase.toLowerCase())
    )
    const coreWordMatches = keywordData.core_words.filter(word =>
      lowerText.includes(word.toLowerCase())
    )
    const weakWordMatches = keywordData.weak_words.filter(word =>
      lowerText.includes(word.toLowerCase())
    )

    // Check exclusions
    const softExclusionMatches = keywordData.soft_exclusion_words.filter(word =>
      lowerText.includes(word.toLowerCase())
    )
    const hardExclusionMatches = keywordData.hard_exclusion_words.filter(word =>
      lowerText.includes(word.toLowerCase())
    )

    if (corePhraseMatches.length > 0 || coreWordMatches.length > 0) {
      // Enhanced scoring calculation
      let score = 0

      // Core phrases have highest weight (3x)
      score += corePhraseMatches.length * 3

      // Core words have medium weight (2x)
      score += coreWordMatches.length * 2

      // Weak words have low weight (1x)
      score += weakWordMatches.length * 1

      // Dominance Rule: Exclusion penalties do NOT apply if:
      // core_phrases > 0 OR core_words >= 1
      const hasStrongSignals = corePhraseMatches.length > 0 || coreWordMatches.length >= 1;

      if (!hasStrongSignals) {
        // Apply Soft Exclusion Penalty (Mild: 20% reduction per match)
        if (softExclusionMatches.length > 0) {
          score *= Math.pow(0.8, softExclusionMatches.length)
        }

        // Apply Hard Exclusion Penalty (Strong: 80% reduction per match)
        // This virtually eliminates the category unless signals are massive (which is handled by hasStrongSignals anyway)
        if (hardExclusionMatches.length > 0) {
          score *= Math.pow(0.2, hardExclusionMatches.length)
        }
      } else {
        // Boost score if strong signals exist to ensure it overcomes any weak penalties
        score *= 1.2
      }

      // Calculate confidence based on enhanced scoring
      // Adjusted denominator to be less penalizing for shorter keyword lists
      const keywordScore = score / Math.sqrt(
        (keywordData.core_phrases.length * 3) +
        (keywordData.core_words.length * 2) +
        (keywordData.weak_words.length || 1)
      )

      const confidence = Math.min(0.95, keywordScore * data.weight)

      results.push({
        context: context as IncidentContext,
        confidence,
        keywords: [...corePhraseMatches, ...coreWordMatches, ...weakWordMatches]
      })
    }
  })

  // Sort by confidence (highest first)
  return results.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Check if two contexts are related through event chain evolution
 */
export function areContextsRelated(context1: IncidentContext, context2: IncidentContext): boolean {
  // Same context is always related
  if (context1 === context2) return true

  // Check if context2 can evolve from context1
  return EVENT_CHAIN_RELATIONS[context1]?.includes(context2) ||
    EVENT_CHAIN_RELATIONS[context2]?.includes(context1)
}

/**
 * Get all contexts related to a given context through event chains
 */
export function getRelatedContexts(context: IncidentContext): IncidentContext[] {
  return (EVENT_CHAIN_RELATIONS as Record<string, IncidentContext[]>)[context] || []
}

/**
 * Calculate context overlap between two posts
 */
export function calculateContextOverlap(
  text1: string,
  text2: string
): {
  overlap: number
  sharedContexts: IncidentContext[]
} {
  const contexts1 = classifyIncidentContext(text1)
  const contexts2 = classifyIncidentContext(text2)

  const contexts1Map = new Map(contexts1.map(c => [c.context, c.confidence]))
  const contexts2Map = new Map(contexts2.map(c => [c.context, c.confidence]))

  const sharedContexts: IncidentContext[] = []
  let totalOverlap = 0

  // Find shared contexts
  for (const [context, conf1] of contexts1Map) {
    if (contexts2Map.has(context)) {
      const conf2 = contexts2Map.get(context)!
      sharedContexts.push(context)
      totalOverlap += Math.min(conf1, conf2)
    }
  }

  // Check for related contexts (event chain evolution)
  const contexts1Related = new Set<IncidentContext>()
  contexts1.forEach(c => {
    getRelatedContexts(c.context).forEach(rc => contexts1Related.add(rc))
  })

  for (const [context, conf2] of contexts2Map) {
    if (contexts1Related.has(context) && !sharedContexts.includes(context)) {
      sharedContexts.push(context)
      totalOverlap += conf2 * 0.5 // Reduced weight for related contexts
    }
  }

  return {
    overlap: Math.min(1.0, totalOverlap),
    sharedContexts
  }
}

/**
 * Determine if two posts share sufficient context overlap
 */
export function hasSufficientContextOverlap(
  text1: string,
  text2: string,
  threshold = 0.3
): boolean {
  const { overlap } = calculateContextOverlap(text1, text2)
  return overlap >= threshold
}