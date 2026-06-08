const metaEnv = (import.meta as any).env || {};
const API_URL = metaEnv.VITE_API_URL || "http://localhost:3000";

export default API_URL;
