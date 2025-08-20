import cron from "node-cron"
import axios from "axios"

// Schedule data ingestion every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log("[v0] Starting scheduled data ingestion...")

    const response = await axios.post(
      "http://localhost:3000/api/ingest",
      {},
      {
        timeout: 60000, // 1 minute timeout
      },
    )

    console.log("[v0] Scheduled ingestion completed:", response.data)
  } catch (error) {
    console.error("[v0] Scheduled ingestion failed:", error)
  }
})

console.log("[v0] Cron job scheduled: Data ingestion every 10 minutes")
