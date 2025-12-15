
import { initializeTokenService } from '../lib/services/token-refresh-service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from docker.env
dotenv.config({ path: path.resolve(process.cwd(), 'docker.env') });

async function verifyDynamicAuth() {
    console.log("🧪 Verifying Dynamic Token Authentication (No Static Fallback)...");

    // 1. Force environment to simulate missing static token
    process.env.API_ACCESS_TOKEN = "";

    // 2. Initialize the service MANUALLY (since this script is a separate process)
    // This proves that with ONLY these credentials (and no static token), we can get auth.
    const config = {
        authUrl: process.env.EXTERNAL_AUTH_URL || "",
        email: process.env.EXTERNAL_API_EMAIL || "",
        password: process.env.EXTERNAL_API_PASSWORD || "",
        clientId: process.env.EXTERNAL_CLIENT_ID,
        clientSecret: process.env.EXTERNAL_CLIENT_SECRET,
        scope: process.env.EXTERNAL_AUTH_SCOPE,
    };

    if (!config.authUrl || !config.email || !config.password) {
        console.error("❌ FAILURE: Missing restart credentials in .env (AUTH_URL, EMAIL, or PASSWORD)");
        process.exit(1);
    }

    const service = initializeTokenService(config, false); // No DB persistence for this test

    try {
        console.log("refresh_service_initialized: true");
        console.log("static_token_present: false");

        console.log("🔄 Attempting to fetch a fresh token...");
        const token = await service.getAccessToken();

        console.log("\n✅ SUCCESS: Token retrieved successfully!");
        console.log(`Token Length: ${token?.length} chars`);

        if (token && token.length > 20) {
            console.log("\nPROOF: The system successfully authenticated using ONLY the email/password credentials.");
            // Clean up
            service.destroy();
            process.exit(0);
        } else {
            console.error("❌ FAILURE: Token returned was empty or invalid.");
            service.destroy();
            process.exit(1);
        }
    } catch (error) {
        console.error("\n❌ FAILED: Could not retrieve token dynamically.");
        console.error(error);
        service.destroy();
        process.exit(1);
    }
}

verifyDynamicAuth();
