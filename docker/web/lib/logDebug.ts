//lib/logDebug.ts

import { IsDebug } from "./backend/config";
export const logDebug = (...args: any[]) => {
  if (IsDebug) console.debug(...args);
};
