// lib/services/token-service-init.ts
// This file initializes the TokenRefreshService at application startup.
// It reads configuration from environment variables and calls initializeTokenService.

import { initializeTokenService } from "./token-refresh-service";

const config = {
    authUrl: process.env.EXTERNAL_AUTH_URL || "",
    email: process.env.EXTERNAL_API_EMAIL || "",
    password: process.env.EXTERNAL_API_PASSWORD || "",
    clientId: process.env.EXTERNAL_CLIENT_ID,
    clientSecret: process.env.EXTERNAL_CLIENT_SECRET,
    scope: process.env.EXTERNAL_AUTH_SCOPE,
};

// Initialize the token service (no database persistence for now)
initializeTokenService(config, false);

// Export nothing; the side‑effect of importing this module runs the init.
export { };
