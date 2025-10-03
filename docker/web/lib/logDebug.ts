//lib/logDebug.ts
//Description: logDebug() conditional on IsDebug from backend config

import { IsDebug } from "./backend/config";
export const logDebug = (...args: any[]) => {
  if (IsDebug) console.debug(...args);
};
