import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Checking DB platforms...")

    // Check distinct platforms in NewsItems
    const platforms = await prisma.newsItem.findMany({
        select: { primaryPlatform: true },
        distinct: ["primaryPlatform"],
    })

    console.log("Distinct NewsItem Platforms:", platforms.map(p => p.primaryPlatform))

    // Check distinct platforms in Posts
    const postPlatforms = await prisma.post.findMany({
        select: { platform: true },
        distinct: ["platform"],
    })

    console.log("Distinct Post Platforms:", postPlatforms.map(p => p.platform))

    // Check count of 'N' posts
    const nPostsCount = await prisma.post.count({
        where: { platform: 'N' }
    })
    console.log("'N' Posts Count:", nPostsCount)

    // Check sample 'N' post
    const samplePost = await prisma.post.findFirst({
        where: { platform: 'N' },
        include: { newsItem: true }
    })

    if (samplePost) {
        console.log("Sample 'N' Post:", {
            id: samplePost.id,
            platform: samplePost.platform,
            newsItemId: samplePost.newsItemId,
            newsItemPrimaryPlatform: samplePost.newsItem?.primaryPlatform
        })
    } else {
        console.log("No sample 'N' post found")
    }

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
