// Server Configuration using Environment Variables
// In production, these values come from .env file
export const ServerSetting = {
    serUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
    appName: import.meta.env.VITE_APP_NAME || "Commission Shop Management System",
    appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
    nodeEnv: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || "development"
};

