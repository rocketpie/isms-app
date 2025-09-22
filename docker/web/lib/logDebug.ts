// web/lib/server-debug.ts
import { IsDebug } from "./backend/config"
export const logDebug = (...args: any[]) => { if (IsDebug) console.debug(...args) }
