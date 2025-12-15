
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { extractPersonEntities, resolveNameAlias, extractAllEntities, extractPrimaryAnchorEntity, type Entity, calculateEntityOverlap, findSharedEntities } from "@/lib/utils/entity-extraction"
import { classifyIncidentContext, hasSufficientContextOverlap, calculateContextOverlap, type IncidentContext } from "@/lib/utils/context-classification"
import { calculateAdvancedSemanticSimilarity, calculateContextAwareSemanticSimilarity } from "@/lib/utils/semantic-similarity"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get("postId")

    if (!postId) {
        return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    try {
        // 1. Get the original post
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { newsItem: true }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // 2. SHARED LOGIC: Find "Related News" (Improved Event-Centric Logic)
        // This runs for both Grouped and Single posts to ensure context is always available.

        // Extract primary anchor entity using priority: Person → Location → Organization → Object
        const anchorEntity = extractPrimaryAnchorEntity(post.postText)
        const anchorEntities = extractAllEntities(post.postText)
        const anchorContexts = classifyIncidentContext(post.postText)

        // Time window for event evolution (longer for investigation phases)
        const startDate = new Date(post.postDate)
        startDate.setDate(startDate.getDate() - 3) // 3 days before for context
        const endDate = new Date(post.postDate)
        endDate.setDate(endDate.getDate() - 3) // 3 days after for follow-ups

        // Find candidate posts with time window (broader search first)
        const currentNewsItemId = post.newsItem?.id
        const candidatePosts = await prisma.post.findMany({
            where: {
                id: { not: post.id },
                newsItemId: currentNewsItemId ? { not: currentNewsItemId } : undefined, // Don't show same group
                postDate: { gte: startDate, lte: endDate }, // Extended window for event chains
            },
            take: 100, // More candidates for better filtering
            include: { newsItem: true },
            orderBy: { reactions: 'desc' }
        })

        // Event-Centric Filtering Pipeline
        const filteredPosts = candidatePosts.filter(candidatePost => {
            // GATE 1: Conditional Anchor Entity Match (Hard gate only for person entities)
            const candidateEntities = extractAllEntities(candidatePost.postText)

            // Check if anchor post has a person entity
            const hasPersonInAnchor = anchorEntities.some(e => e.type === 'person')

            let hasEntityMatch = false

            if (hasPersonInAnchor && anchorEntity?.type === 'person') {
                // HARD GATE: If person exists in anchor, candidate MUST mention same person
                const candidatePersons = candidateEntities.filter(e => e.type === 'person')
                const anchorPersons = anchorEntities.filter(e => e.type === 'person')

                hasEntityMatch = anchorPersons.some(anchorPerson => {
                    return candidatePersons.some(candidatePerson => {
                        // Direct match
                        if (anchorPerson.value === candidatePerson.value) return true
                        // Partial match (one name contained in another)
                        if (anchorPerson.value.includes(candidatePerson.value) || candidatePerson.value.includes(anchorPerson.value)) return true
                        // Alias resolution
                        const resolved1 = resolveNameAlias(anchorPerson.value, [anchorPerson.value, candidatePerson.value])
                        const resolved2 = resolveNameAlias(candidatePerson.value, [anchorPerson.value, candidatePerson.value])
                        return resolved1 && resolved2 && resolved1 === resolved2
                    })
                })

                // If no person match, reject immediately (HARD GATE)
                if (!hasEntityMatch) return false
            } else {
                // No person in anchor or anchor is not a person
                // Use next priority entity type (location, organization, or object)
                const anchorPrimaryType = anchorEntity?.type || 'object'
                const candidateSameType = candidateEntities.filter(e => e.type === anchorPrimaryType)

                hasEntityMatch = candidateSameType.some(candidateEntity => {
                    return anchorEntities.some(anchorEntity => {
                        if (anchorEntity.type !== anchorPrimaryType) return false
                        // Direct match for location/organization/object
                        return anchorEntity.value === candidateEntity.value ||
                            anchorEntity.value.includes(candidateEntity.value) ||
                            candidateEntity.value.includes(anchorEntity.value)
                    })
                })
            }

            // GATE 2: Context Classification Match
            const candidateContexts = classifyIncidentContext(candidatePost.postText)

            // Check if contexts overlap or are related through event chains
            const { overlap, sharedContexts } = calculateContextOverlap(post.postText, candidatePost.postText)
            const hasContextMatch = overlap >= 0.3 || hasSufficientContextOverlap(post.postText, candidatePost.postText, 0.3)

            // If no context match, reject
            if (!hasContextMatch) return false

            // GATE 3: Semantic Similarity (Final validation)
            const semanticSim = calculateContextAwareSemanticSimilarity(
                post.postText,
                candidatePost.postText,
                0.05 // Small boost for shared entities
            )

            return semanticSim >= 0.65 // High threshold for semantic similarity
        })

        // Apply confidence scoring
        const scoredPosts = filteredPosts.map(candidatePost => {
            const candidatePersons = extractPersonEntities(candidatePost.postText)
            const candidateContexts = classifyIncidentContext(candidatePost.postText)
            const candidateEntities = extractAllEntities(candidatePost.postText)

            // Calculate entity overlap score
            const entityOverlap = calculateEntityOverlap(anchorEntities, candidateEntities)

            // Calculate semantic similarity
            const semanticSim = calculateAdvancedSemanticSimilarity(post.postText, candidatePost.postText)

            // Calculate context overlap
            const { overlap } = calculateContextOverlap(post.postText, candidatePost.postText)

            // Calculate Dice similarity (as support signal)
            const diceSim = calculateJaccardSimilarity(post.postText, candidatePost.postText)

            // Weighted confidence score
            const confidence = (semanticSim * 0.55) + (entityOverlap * 0.30) + (diceSim * 0.15)

            return {
                ...candidatePost,
                confidence,
                entityOverlap,
                semanticSim,
                contextOverlap: overlap,
                sharedEntities: findSharedEntities(anchorEntities, candidateEntities)
            }
        })

        // Filter by confidence threshold
        const highConfidencePosts = scoredPosts.filter(sp => sp.confidence >= 0.72)

        // Sort by confidence
        highConfidencePosts.sort((a, b) => b.confidence - a.confidence)

        // Aggregate into distinct News Items
        const uniqueNewsItemIds = new Set<string>()
        const relatedNewsItems: any[] = []

        for (const p of highConfidencePosts) {
            if (p.newsItem && !uniqueNewsItemIds.has(p.newsItem.id)) {
                uniqueNewsItemIds.add(p.newsItem.id)
                relatedNewsItems.push({
                    ...p.newsItem,
                    confidence: p.confidence,
                    reasoning: {
                        sharedEntities: p.sharedEntities,
                        entityOverlap: p.entityOverlap,
                        semanticSimilarity: p.semanticSim,
                        contextOverlap: p.contextOverlap
                    }
                })
            }
            if (relatedNewsItems.length >= 5) break
        }

        // 3. BRANCH A: If it belongs to a NewsItem, return that group's data
        if (post.newsItem) {
            const newsItem = await prisma.newsItem.findUnique({
                where: { id: post.newsItem.id },
                include: { posts: { orderBy: { postDate: 'desc' } } }
            })

            if (newsItem) {
                return NextResponse.json({
                    type: 'group',
                    newsItem: {
                        ...newsItem,
                        postAnalysis: newsItem.postAnalysisJson ? JSON.parse(newsItem.postAnalysisJson) : null
                    },
                    posts: newsItem.posts,
                    relatedNews: relatedNewsItems
                })
            }
        }

        // 4. BRANCH B: If no NewsItem, perform improved similarity search (Event-Centric Virtual Grouping)

        // Construct a "Virtual Group" with high-confidence posts
        const allPosts = [post, ...highConfidencePosts]

        // Add explanation for grouping
        const explanation = {
            primaryAnchorEntity: anchorEntity,
            primaryEntities: anchorEntities,
            primaryContexts: anchorContexts.map(c => c.context),
            eventChain: anchorContexts.length > 0 ?
                anchorContexts[0].confidence >= 0.5 ? 'SAME_EVENT' : 'RELATED_EVENT' : 'SEMANTIC_MATCH',
            confidence: highConfidencePosts.length > 0 ?
                Math.max(...highConfidencePosts.map(p => p.confidence)) : 1.0
        }

        return NextResponse.json({
            type: 'virtual-group',
            mainPost: post,
            similarPosts: allPosts,
            relatedNews: relatedNewsItems,
            groupingExplanation: explanation,
            improved: true // Flag to indicate improved algorithm is active
        })

    } catch (error) {
        console.error("Error in related analysis:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// Helper: Extract meaningful keywords with stop words removal
function extractKeywords(text: string): string[] {
    if (!text) return []

    // Extended stop words list for better filtering
    const stopWords = new Set([
        'about', 'after', 'before', 'their', 'where', 'which', 'would', 'could',
        'this', 'that', 'these', 'those', 'from', 'with', 'have', 'will', 'been',
        'said', 'says', 'according', 'report', 'reports', 'news', 'story', 'article',
        'just', 'more', 'most', 'some', 'many', 'much', 'very', 'really', 'also',
        'here', 'there', 'what', 'when', 'how', 'why', 'who', 'being', 'doing',
        'does', 'did', 'can', 'cannot', 'should', 'would', 'could', 'might'
    ])

    return text.toLowerCase().split(/\s+/)
        .filter(w => w.length > 3) // Filter short words
        .filter(w => !stopWords.has(w)) // Remove stop words
        .filter(w => /^[\p{L}\p{M}]+$/u.test(w)) // Unicode letters and marks (supports Bangla and other languages)
        .slice(0, 8) // Take top 8 meaningful keywords
}

import { calculateJaccardSimilarity } from "@/lib/utils/text-similarity"
