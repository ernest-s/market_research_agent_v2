// frontend/src/env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        AUTH0_ISSUER_BASE_URL: string;
        AUTH0_CLIENT_ID: string;
        AUTH0_MANAGEMENT_DOMAIN: string;
        AUTH0_MANAGEMENT_CLIENT_ID: string;
        AUTH0_MANAGEMENT_CLIENT_SECRET: string;
        AUTH0_BASE_URL: string;
    }
}
