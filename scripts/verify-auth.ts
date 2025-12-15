
import fs from 'fs';
import path from 'path';
import { initializeTokenService, getTokenService } from '../lib/services/token-refresh-service';

async function verifyAuth() {
    console.log("🔍 Verifying Token Refresh Service Configuration...");

    // Manually load docker.env for validation
    const envPath = path.join(process.cwd(), 'docker.env');
    if (fs.existsSync(envPath)) {
        console.log("📂 Loading environment from docker.env");
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;

            const equalsIndex = line.indexOf('=');
            if (equalsIndex > 0) {
                const key = line.substring(0, equalsIndex).trim();
                const value = line.substring(equalsIndex + 1).trim();
                if (key) {
                    process.env[key] = value;
                }
            }
        });
    } else {
        console.warn("⚠️ docker.env not found, using existing process.env");
    }

    const config = {
        authUrl: process.env.EXTERNAL_AUTH_URL || "",
        email: process.env.EXTERNAL_API_EMAIL || "",
        password: process.env.EXTERNAL_API_PASSWORD || "",
        clientId: process.env.EXTERNAL_CLIENT_ID,
        clientSecret: process.env.EXTERNAL_CLIENT_SECRET,
        scope: process.env.EXTERNAL_AUTH_SCOPE,
    };

    const staticToken = process.env.EXTERNAL_API_TOKEN;

    console.log("⚙️  Configuration:");
    console.log(`   Auth URL: ${config.authUrl}`);
    console.log(`   Email: ${config.email}`);
    console.log(`   Static Token Provided: ${staticToken ? "YES (Length: " + staticToken.length + ")" : "NO"}`);

    // Initialize Service
    console.log("\n🚀 Initializing Token Service...");
    // We pass 'false' for useDatabase to avoid Prisma connection issues during this quick test
    initializeTokenService(config, false);
    const service = getTokenService();

    if (!service) {
        console.error("❌ Failed to initialize service");
        return;
    }

    // Attempt to get token
    console.log("🔄 Attempting to fetch access token...");
    try {
        // If static token is set, the service might not use it directly unless we modify logic, 
        // BUT the service logic we touched mainly deals with dynamic auth.
        // However, the 'ingest/route.ts' has fallback logic. 
        // The TokenRefreshService itself focuses on dynamic auth. 
        // Let's see if the dynamic auth works (which is the core issue).

        // Note: TokenRefreshService doesn't automatically look at EXTERNAL_API_TOKEN in its logic,
        // it's the CONSUMER (route.ts) that checks static token usually.
        // But we want to see if the dynamic refresher works.

        const token = await service.getAccessToken();

        if (token) {
            console.log("✅ Success! Token obtained.");
            console.log(`   Token: ${token.substring(0, 20)}...`);
            return;
        } else {
            // If dynamic auth fails, we check if static token would have saved us (mentally),
            // but here we strictly test the service's ability to get a token.
            console.error("❌ Failed to obtain token via dynamic authentication.");
            if (staticToken) {
                console.log("ℹ️  However, a STATIC TOKEN is present in env, so the app will likely fallback to that and work.");
            }
        }

    } catch (error) {
        console.error("❌ Error during token fetch:", error);
    }
}

verifyAuth().catch(console.error);
