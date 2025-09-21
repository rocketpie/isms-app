// web/lib/server-debug.ts
export const isDebug = process.env.DEBUG === '1'
export const logDebug = (...args: any[]) => { if (isDebug) console.debug(...args) }
