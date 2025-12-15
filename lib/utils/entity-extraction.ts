/**
 * Entity extraction utilities for Bangla news analysis
 * Extracts Person, Location, Organization, and Object entities
 */

// Common Bangla name prefixes and suffixes
const NAME_PREFIXES = ['মি.', 'মিস্টার', 'ড.', 'প্রফেসর', 'ইঞ্জিনিয়ার', 'অ্যাডভোকেট']
const NAME_SUFFIXES = ['খান', 'উদ্দিন', 'হোসেন', 'আহমেদ', 'চৌধুরী', 'সরকার', 'মিয়া', 'বেগম']

// Bangla location indicators and common places
const LOCATION_MARKERS = ['এ', 'এলাকা', 'এর', 'এ', 'জেলা', 'থানা', 'সিটি', 'শহর', 'গ্রাম', 'পৌরসভা', 'ইউনিয়ন']
const BANGLADESH_LOCATIONS = [
  'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ',
  'গাজীপুর', 'নারায়ণগঞ্জ', 'কুমিল্লা', 'যশোর', 'বগুড়া', 'কুষ্টিয়া', 'বরিশাল', 'ফরিদপুর',
  'কক্সবাজার', 'চাঁদপুর', 'ব্রাহ্মণবাড়িয়া', 'মৌলভীবাজার', 'সুনামগঞ্জ', 'হবিগঞ্জ'
]
const INTERNATIONAL_LOCATIONS = [
  'ইউক্রেন', 'রাশিয়া', 'থাইল্যান্ড', 'কম্বোডিয়া', 'ভারত', 'পাকিস্তান', 'নেপাল', 'ভুটান',
  'মার্কিন', 'আমেরিকা', 'যুক্তরাষ্ট্র', 'ব্রিটেন', 'ইংল্যান্ড', 'জার্মানি', 'ফ্রান্স', 'চীন',
  'জাপান', 'দক্ষিণ কোরিয়া', 'উত্তর কোরিয়া', 'মধ্যপ্রাচ্য', 'সৌদি আরব', 'ইরাক', 'আফগানিস্তান'
]

// Organization keywords
const ORG_MARKERS = ['কর্তৃপক্ষ', 'বাহিনী', 'দপ্তর', 'অধিদপ্তর', 'সংস্থা', 'প্রতিষ্ঠান', 'কোম্পানি', 'ব্যাংক']
const ORG_NAMES = [
  'পুলিশ', 'সেনাবাহিনী', 'নৌবাহিনী', 'বিমানবাহিনী', 'র্যাব', 'বিজিবি', 'আনসার',
  'আওয়ামী লীগ', 'বিএনপি', 'জাতীয় পার্টি', 'জামায়াত', 'জাসদ', 'ওয়ার্কার্স পার্টি',
  'স্বাস্থ্য অধিদপ্তর', 'শিক্ষা অধিদপ্তর', 'দুর্যোগ ব্যবস্থাপনা', 'ফায়ার সার্ভিস',
  'সোনালি ব্যাংক', 'জনতা ব্যাংক', 'অগ্রণী ব্যাংক', 'রূপালী ব্যাংক', 'বেসিক ব্যাংক',
  'বিআরটিএ', 'ওয়েসা', 'বিটিআরসি', 'পেট্রোবাংলা', 'তেল', 'গ্যাস', 'বিদ্যুৎ'
]

// Object/Identifier patterns
const OBJECT_PATTERNS = {
  flight: [/(?:ফ্লাইট|বিমান)?\s*(?:BG|বিজি)[\s-]*\d{2,5}\b/gi, /এয়ারলাইন্স\s+\d+/gi],
  vehicle: [/(?:বাস|ট্রাক|কার|মাইক্রোবাস|জিপ)\s+(?:[\u0980-\u09FF\s-]*)[০-৯\d]{2}[-\s][০-৯\d]{4}/gi],
  ship: [/(?:এমভি|লঞ্চ|জাহাজ)\s+[\u0980-\u09FF]{2,30}/gi],
  law: [/(?:আইন|ধারা|বিধি)\s+(?:নং\s*)?[০-৯\d]+(?:\/(?:২০)?[০-৯\d]{2})?/gi, /সংশোধনী\s*\d+/gi],
  project: [/প্রকল্প\s*[\"\""][^\""\"]+[\""\"]/gi, /প্রকল্প\s*[\u0980-\u09FF\w\s]+/gi],
  case: [/(?:মামলা)\s+(?:নং\s*)?[০-৯\d]+(?:\/(?:২০)?[০-৯\d]{2})?/gi, /মামলা\s*[\u0980-\u09FF\w]+/gi]
}

export type EntityType = 'person' | 'location' | 'organization' | 'object'

export interface Entity {
  type: EntityType
  value: string
  confidence: number
  category?: string // For objects: flight, vehicle, etc.
}

// Common person markers in Bangla
const PERSON_MARKERS = [
  'বলেন', 'জানান', 'বলেছেন', 'সন্দেহভাজন', 'আসামি', 'অভিযুক্ত', 'ভুক্তভোগী',
  'কর্মকর্তা', 'সাংবাদিক', 'চিকিৎসক', 'রোগী', 'আহত', 'নিহত'
]

// Crime role indicators for enhanced context confidence
const CRIME_ROLE_INDICATORS = [
  'ভুক্তভোগী', 'নিখোঁজ ব্যক্তি', 'গুম হওয়া ব্যক্তি', 'অভিযুক্ত', 'সন্দেহভাজন',
  'আসামি', 'গ্রেপ্তারকৃত', 'হাজতবাস', 'কারাবন্দি', 'জামিনপ্রাপ্ত',
  'পলাতক আসামি', 'ওয়ারেন্টভুক্ত', 'অনুপস্থিত আসামি', 'গ্রেফতার',
  'গ্রেপ্তার হওয়া', 'আটক', 'আটককৃত', 'থানায় সোপর্দ',
  'আদালতে সোপর্দ', 'জামিন নাকচ', 'জামিন আবেদন',
  'ধর্ষণের শিকার', 'যৌন নির্যাতনের শিকার', 'চাঁদাবাজির শিকার',
  'হুমকির শিকার', 'জিম্মি', 'অপহৃত', 'অপহরণকারী', 'খুনী',
  'হত্যাকারী', 'দুর্বৃত্ত', 'সন্ত্রাসী', 'আততায়ী', 'চাঁদাবাজ',
  'জালিয়াত', 'প্রতারক', 'দুর্নীতিবাজ', 'অর্থপাচারকারী',
  'ঘুষখোর', 'ঘুষদাতা', 'অনৈতিক সুবিধাভোগী'
]

// Person entity patterns
const PERSON_PATTERNS = [
  // Pattern: Name + Occupation/Role
  /([অ-হাড়ৎ\s]{2,20})\s+(সাংবাদিক|চিকিৎসক|কর্মকর্তা|আইনজীবী|শিক্ষক|ছাত্র|ব্যবসায়ী|পুলিশ)/g,

  // Pattern: Name + Crime Role
  /([অ-হাড়ৎ\s]{2,20})\s+(ভুক্তভোগী|অভিযুক্ত|সন্দেহভাজন|আসামি|গ্রেপ্তারকৃত|হাজতবাস|কারাবন্দি|জামিনপ্রাপ্ত)/g,

  // Pattern: Name + Location
  /([অ-হাড়ৎ\s]{2,20})\s+(ঢাকা|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|বরিশাল|রংপুর|ময়মনসিংহ)/g,

  // Pattern: Quoted names
  /"([^"]{2,30})"/g,

  // Pattern: Name + father/son relation
  /([অ-হাড়ৎ\s]{2,20})\s+(পুত্র|কন্যা|পিতা|মাতা|স্ত্রী|স্বামী)/g,

  // Pattern: Capitalized words (potential names)
  /\b([অ-হ][অ-হাড়ৎ]{1,20})\b(?=\s+(?:খান|উদ্দিন|হোসেন|আহমেদ|চৌধুরী|সরকার|মিয়া|বেগম|শেখ|মণ্ডল))/g
]

// Common stop words that are NOT names
const NON_NAME_WORDS = new Set([
  'এই', 'সেই', 'যে', 'তিনি', 'তার', 'তারা', 'সবাই', 'অনেকে', 'কেউ', 'কেউই',
  'কি', 'কেন', 'কীভাবে', 'কোথায়', 'কখন', 'কত', 'কোন', 'কোনো',
  'একজন', 'দুইজন', 'তিনজন', 'বেশ কিছু', 'একই', 'একই সাথে', 'একই সময়',
  'হামলা', 'ঘটনা', 'পরিস্থিতি', 'অবস্থা', 'খবর', 'তথ্য', 'বিষয়', 'কারণে',
  'ভোট', 'নির্বাচন', 'সরকার', 'দল', 'রাজনীতি', 'প্রশাসন', 'পুলিশ', '�ইন',
  'দেশ', 'বিদেশ', 'রাজধানী', 'এলাকা', 'জেলা', 'বিভাগ', 'থানা', 'ইউনিয়ন'
])

/**
 * Extract crime role indicators from text to boost context confidence
 */
export function extractCrimeRoles(text: string): { role: string; confidence: number }[] {
  const roles: { role: string; confidence: number }[] = []
  const lowerText = text.toLowerCase()

  CRIME_ROLE_INDICATORS.forEach(indicator => {
    if (lowerText.includes(indicator.toLowerCase())) {
      // Higher confidence for more specific crime roles
      let confidence = 0.7
      if (indicator.includes('শিকার') || indicator.includes('ভুক্তভোগী')) {
        confidence = 0.85
      } else if (indicator.includes('অভিযুক্ত') || indicator.includes('আসামি') || indicator.includes('গ্রেপ্তার')) {
        confidence = 0.9
      } else if (indicator.includes('খুনী') || indicator.includes('হত্যাকারী') || indicator.includes('ধর্ষণ')) {
        confidence = 0.95
      }

      roles.push({ role: indicator, confidence })
    }
  })

  return roles.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Extract all entities from Bangla text with confidence scores
 */
export function extractAllEntities(text: string): Entity[] {
  const entities: Entity[] = []

  // Extract Person entities
  const personEntities = extractPersonEntitiesWithConfidence(text)
  entities.push(...personEntities)

  // Extract Location entities
  const locationEntities = extractLocationEntities(text)
  entities.push(...locationEntities)

  // Extract Organization entities
  const orgEntities = extractOrganizationEntities(text)
  entities.push(...orgEntities)

  // Extract Object entities
  const objectEntities = extractObjectEntities(text)
  entities.push(...objectEntities)

  // Sort by confidence and type priority
  return entities.sort((a, b) => {
    const typePriority = { person: 4, location: 3, organization: 2, object: 1 }
    if (typePriority[a.type] !== typePriority[b.type]) {
      return typePriority[b.type] - typePriority[a.type]
    }
    return b.confidence - a.confidence
  })
}

/**
 * Extract primary anchor entity based on priority
 */
export function extractPrimaryAnchorEntity(text: string): Entity | null {
  const entities = extractAllEntities(text)
  return entities.length > 0 ? entities[0] : null
}

/**
 * Extract person entities with confidence scores
 */
function extractPersonEntitiesWithConfidence(text: string): Entity[] {
  const entities: Entity[] = []
  const cleanText = text.replace(/[^\অ-হাড়ৎ\s]/g, ' ')

  // Apply patterns with confidence
  PERSON_PATTERNS.forEach((pattern, index) => {
    const matches = cleanText.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const validMatch = match.match(/([অ-হাড়ৎ\s]{2,30})/)
        if (!validMatch) return

        const nameMatch = validMatch[1]
        const name = nameMatch.trim()
        if (isLikelyPersonName(name)) {
          entities.push({
            type: 'person',
            value: name,
            confidence: 0.8 + (index * 0.05) // Different patterns have slightly different confidence
          })
        }
      })
    }
  })

  // Look for capitalized names with surname indicators
  const capitalWords = cleanText.match(/\b([অ-হ][অ-হাড়ৎ]{2,25})\s+(খান|উদ্দিন|হোসেন|আহমেদ|চৌধুরী|সরকার|মিয়া|বেগম|শেখ|মণ্ডল)\b/g)
  if (capitalWords) {
    capitalWords.forEach(match => {
      entities.push({
        type: 'person',
        value: match.trim(),
        confidence: 0.9
      })
    })
  }

  // Remove duplicates and sort
  return entities.filter((e, i, a) => a.findIndex(x => x.value === e.value) === i)
    .sort((a, b) => b.confidence - a.confidence)
}

/**
 * Extract location entities
 */
function extractLocationEntities(text: string): Entity[] {
  const entities: Entity[] = []
  const cleanText = text.toLowerCase()

  // Check Bangladesh locations
  BANGLADESH_LOCATIONS.forEach(location => {
    if (cleanText.includes(location.toLowerCase())) {
      entities.push({
        type: 'location',
        value: location,
        confidence: 0.9
      })
    }
  })

  // Check international locations
  INTERNATIONAL_LOCATIONS.forEach(location => {
    if (cleanText.includes(location.toLowerCase())) {
      entities.push({
        type: 'location',
        value: location,
        confidence: 0.85
      })
    }
  })

  // Look for location patterns
  const locationPattern = /\b([অ-হাড়ৎ]{2,20})\s+(জেলা|থানা|সিটি|শহর|গ্রাম|এলাকা|সড়ক)\b/g
  let match
  while ((match = locationPattern.exec(text)) !== null) {
    entities.push({
      type: 'location',
      value: match[1] + ' ' + match[2],
      confidence: 0.75
    })
  }

  return entities
}

/**
 * Extract organization entities
 */
function extractOrganizationEntities(text: string): Entity[] {
  const entities: Entity[] = []
  const cleanText = text.toLowerCase()

  // Check known organization names
  ORG_NAMES.forEach(org => {
    if (cleanText.includes(org)) {
      entities.push({
        type: 'organization',
        value: org,
        confidence: 0.85
      })
    }
  })

  // Look for organization patterns
  ORG_MARKERS.forEach(marker => {
    const pattern = new RegExp(`\\b([অ-হাড়ৎ\\s]{3,30})\\s+${marker}\\b`, 'g')
    let match
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'organization',
        value: match[1].trim() + ' ' + marker,
        confidence: 0.7
      })
    }
  })

  return entities
}

/**
 * Extract object entities (flights, vehicles, etc.)
 */
function extractObjectEntities(text: string): Entity[] {
  const entities: Entity[] = []

  Object.entries(OBJECT_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: 'object',
            value: match.trim(),
            confidence: 0.8,
            category
          })
        })
      }
    })
  })

  return entities
}

/**
 * Extract primary person entities from Bangla text (backward compatibility)
 */
export function extractPersonEntities(text: string): string[] {
  const personEntities = extractPersonEntitiesWithConfidence(text)
  return personEntities.map(e => e.value)
}

/**
 * Check if a string is likely a person name
 */
function isLikelyPersonName(text: string): boolean {
  // Must be between 2-25 characters
  if (text.length < 2 || text.length > 25) return false

  // Must contain at least one Bangla letter
  if (!/[অ-হাড়ৎ]/.test(text)) return false

  // Must not be a common non-name word
  if (NON_NAME_WORDS.has(text.toLowerCase())) return false

  // Must not be too generic (single common words)
  if (text.split(' ').length === 1 && text.length < 4) return false

  // Must have a reasonable ratio of Bangla letters
  const banglaLetters = (text.match(/[অ-হাড়ৎ]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (banglaLetters / totalChars < 0.7) return false

  return true
}

/**
 * Resolve name aliases (e.g., "হাদি" -> "ওসমান হাদি")
 */
export function resolveNameAlias(name: string, fullNames: string[]): string | null {
  // Check if this is already a full name
  if (name.split(' ').length >= 2) return name

  // Try to find matching full name
  for (const fullName of fullNames) {
    if (fullName.includes(name) || name.includes(fullName)) {
      return fullName
    }
  }

  return null
}

/**
 * Calculate entity overlap between two entity lists
 */
export function calculateEntityOverlap(entities1: Entity[], entities2: Entity[]): number {
  if (entities1.length === 0 || entities2.length === 0) return 0

  let overlapCount = 0
  const totalMax = Math.max(entities1.length, entities2.length)

  entities1.forEach(e1 => {
    const matchingEntity = entities2.find(e2 =>
      e1.type === e2.type && (
        e1.value === e2.value ||
        e1.value.includes(e2.value) ||
        e2.value.includes(e1.value)
      )
    )
    if (matchingEntity) {
      overlapCount++
    }
  })

  return overlapCount / totalMax
}

/**
 * Find shared entities between two entity lists
 */
export function findSharedEntities(entities1: Entity[], entities2: Entity[]): string[] {
  const shared: string[] = []

  entities1.forEach(e1 => {
    const matchingEntity = entities2.find(e2 =>
      e1.type === e2.type && (
        e1.value === e2.value ||
        e1.value.includes(e2.value) ||
        e2.value.includes(e1.value)
      )
    )
    if (matchingEntity) {
      shared.push(`${e1.type}:${e1.value}`)
    }
  })

  return shared
}

/**
 * Extract person and their aliases from a collection of posts
 */
export function extractPersonsWithAliases(posts: Array<{ postText: string }>): Map<string, string[]> {
  const personMap = new Map<string, string[]>()
  const allNames = new Set<string>()

  // First pass: extract all potential names
  posts.forEach(post => {
    const names = extractPersonEntities(post.postText)
    names.forEach(name => allNames.add(name))
  })

  const nameArray = Array.from(allNames)

  // Second pass: resolve aliases
  posts.forEach(post => {
    const names = extractPersonEntities(post.postText)

    names.forEach(name => {
      // Try to find the full name version
      const fullName = resolveNameAlias(name, nameArray) || name

      if (!personMap.has(fullName)) {
        personMap.set(fullName, [])
      }

      // Add alias if different
      if (name !== fullName && !personMap.get(fullName)!.includes(name)) {
        personMap.get(fullName)!.push(name)
      }
    })
  })

  return personMap
}