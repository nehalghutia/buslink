import { env } from "cloudflare:workers";
export function liveDb() { if (!env.DB) throw new Error("Location service unavailable"); return env.DB; }
