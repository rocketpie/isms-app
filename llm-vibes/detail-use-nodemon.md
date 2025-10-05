I tried to follow this https://github.com/vercel/next.js/tree/canary/examples/custom-server

here's my 
nodemon.json:
{
  "watch": ["server.ts"],
  "exec": "ts-node --project tsconfig.server.json server.ts",
  "ext": "js ts"
}

server.ts:
import { createServer } from "http";
import { parse } from "url";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});

tsconfig.server.json:
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "lib": ["es2019"],
    "target": "es2019",
    "isolatedModules": false,
    "noEmit": false
  },
  "include": ["server.ts"]
}

however, wen I run `npm run dev`:
[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): server.ts
[nodemon] watching extensions: js,ts
[nodemon] starting `ts-node --project tsconfig.server.json server.ts`
sh: ts-node: not found
[nodemon] failed to start process, "ts-node --project tsconfig.server.json server.ts" exec not found
[nodemon] Error
    at Bus.<anonymous> (/web/node_modules/nodemon/lib/nodemon.js:164:25)
    at Bus.emit (node:events:531:35)
    at ChildProcess.<anonymous> (/web/node_modules/nodemon/lib/monitor/run.js:199:11)
    at ChildProcess.emit (node:events:519:28)
    at ChildProcess._handle.onexit (node:internal/child_process:293:12)
 



########################################################################
########################################################################





Here’s a quick fix plan.

# Affected

* **Web / Next.js dev setup** (custom server, nodemon)
* **Local dev scripts / container shell**
  KB refs:   

---

## What’s happening

`sh: ts-node: not found` → either:

1. `ts-node` isn’t installed in your current environment, or
2. you’re running inside the docker dev shell without node modules installed there (our KB’s flow runs `npm install` **inside** the `/web` container/shell).  

---

## Fastest fix (keep nodemon + ts-node)

1. Install dev deps (run this in the same shell where you run `npm run dev`):

```bash
npm i -D ts-node typescript @types/node nodemon
```

2. Make nodemon call the local binary via `npx` (avoids PATH issues):
   **nodemon.json**

```json
{
  "watch": ["server.ts"],
  "exec": "npx ts-node --project tsconfig.server.json server.ts",
  "ext": "js ts"
}
```

3. Add scripts:

```json
{
  "scripts": {
    "dev": "nodemon",
    "build:server": "tsc -p tsconfig.server.json",
    "start:server": "node dist/server.js"
  }
}
```

> If you’re using the **docker dev task** from our KB, first open that shell and then run `npm install` there before `npm run dev`. Steps are in the runbook.  

---

## Even simpler (ditch ts-node): use **tsx**

`tsx` is zero-config and fast.

```bash
npm i -D tsx nodemon
```

**nodemon.json**

```json
{
  "watch": ["server.ts"],
  "exec": "npx tsx server.ts",
  "ext": "js ts"
}
```

(Keep your `tsconfig.server.json` as-is. `tsx` handles it.)

---

## Sanity checks

* Node modules present where you run dev:

  ```bash
  ls node_modules/.bin | grep -E 'ts-node|tsx|nodemon'
  ```
* If using our **docker npm** flow: open the dockerized shell, `cd /web`, then:

  ```bash
  npm install
  npm run dev
  ```

  Visit `http://localhost:3000/`. 

---

## Notes for this repo

* Your `server.ts` and `tsconfig.server.json` (CommonJS target) are fine with either `ts-node` or `tsx`.
* If you ever switch to a compiled start:

  ```bash
  npm run build:server && npm run start:server
  ```

If this still errors, paste your `package.json` and how you start the dev shell (host vs docker), and I’ll align it with the KB scripts.   

 



########################################################################
########################################################################





Ok, dev works now.

nodemon.json:
{
  "watch": ["server.ts"],
  "exec": "npx tsx server.ts",
  "ext": "js ts"
}

package.json .scripts:
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "echo \"(lint stub)\""
  },

server.ts // tsconfig.server.json unchanged.

The production app fails now, however.
here's the Dockerfile:
# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# --- build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- run ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# These can be overridden by compose env_file at runtime
ENV NEXT_PUBLIC_API_URL=http://localhost:7771
ENV NEXT_PUBLIC_AUTH_URL=http://localhost:7779
ENV NEXT_PUBLIC_SITE_URL=http://localhost:7770

# copy the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

and error message:
Something went wrong

An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.

and error message during login:
JSON.parse: unexpected character at line 1 column 1 of the JSON data

 



########################################################################
########################################################################





Got it—dev is fine, prod is breaking in Docker. Here’s how to fix it fast.

# Affected

* **Next.js build & runtime (Docker)**
* **Env propagation (NEXT_PUBLIC_… & server-side env)**
* **Custom server vs. standalone server choice**

---

## Why prod breaks (2 common causes)

1. **Env values only set at runtime**
   `NEXT_PUBLIC_*` are **inlined at build time**. In your Dockerfile you set them in the **runner** stage, so the built app may still point to defaults (or `localhost`), causing your client fetch to return HTML/redirects → `JSON.parse … at column 1` (often an HTML error page or empty response).

2. **Custom server mismatch**
   In dev you run `server.ts` (via `tsx`). In prod your container runs **Next’s generated** `.next/standalone/server.js` (built-in server), not your `server.ts`. That’s ok, but be aware the Docker image won’t use your custom server unless you explicitly build & run it.

---

## Pick one deployment path

### Option A — Use Next “standalone” server (recommended)

1. Ensure `next.config.js` has standalone output:

```js
// next.config.js
module.exports = {
  output: 'standalone',
};
```

2. Build-time env (pass through as build args so they’re inlined):

```dockerfile
# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# --- build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 👇 add libc6-compat (recommended for Next/sharp on Alpine)
RUN apk add --no-cache libc6-compat

# build-time args (compose will pass these)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_SITE_URL
# if you also have server-only env, add ARGs for them too

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# make NEXT_PUBLIC_* available during build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

# --- run ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# runtime env (server-only secrets etc.) can be added here as needed

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**docker compose (example)**

```yaml
services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: "http://api:7771"
        NEXT_PUBLIC_AUTH_URL: "http://auth:7779"
        NEXT_PUBLIC_SITE_URL: "http://web:3000"
    environment:
      # server-only env here if you have any
    ports:
      - "7770:3000"
    depends_on:
      - api
      - auth
  api:
    # …
  auth:
    # …
```

> Important: do **not** use `http://localhost:*` for cross-container calls. Use the Docker service names (e.g., `http://api:7771`). `localhost` inside the **web** container points to the web container itself, which leads to HTML responses or 502s and then the `JSON.parse` error.

---

### Option B — Use your **custom server** in prod

If you really want to keep `server.ts` for prod, compile and run it:

```json
// package.json (add)
"scripts": {
  "build": "next build",
  "build:server": "tsc -p tsconfig.server.json",
  "start": "node dist/server.js"
}
```

```dockerfile
# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# --- build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

# build-time args for NEXT_PUBLIC_* (same as Option A)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build && npm run build:server

# --- run ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# copy build output (Next + your compiled server)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## Quick diagnostics you can run now

Inside the running **web** container:

```bash
# 1) Confirm build-time inlined values:
node -e "console.log('API:', process.env.NEXT_PUBLIC_API_URL, 'AUTH:', process.env.NEXT_PUBLIC_AUTH_URL)"

# 2) Is the API reachable from the web container?
apk add --no-cache curl
curl -i http://api:7771/health    # expect 200 JSON, not HTML
curl -i http://auth:7779/health   # same

# 3) See what your frontend is actually getting (why JSON.parse fails)
curl -i http://web:3000/api/whatever-endpoint-you-call
```

If the curl shows an HTML page (starts with `<!doctype html>` or a Next error page), your URL or headers are wrong (CORS/redirect) or you’re still hitting `localhost` in-container.

---

## Likely fixes for your two errors

* **“An error occurred in the Server Components render … digest …”**
  Usually a server-side exception because an env var was undefined *at build time* or an upstream fetch failed. Fix by passing the right `NEXT_PUBLIC_*` (and any server-only vars) as **build args** (Option A/B above) and using container service names, not `localhost`.

* **“JSON.parse: unexpected character …” on login**
  Your client-side code expects JSON but received HTML/redirect or an error page (bad URL, CORS, or 50x). After switching to `http://auth:7779` (service name) and building with those values, this typically resolves.

---

## Tell me which path you want (A or B)

If you share:

* `next.config.js`
* how the frontend calls the API/auth (code snippet)
* your `docker-compose.yml`

…I’ll tailor the exact compose + Dockerfile and verify the URLs you should use.
