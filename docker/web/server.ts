//server.ts
// used by nodemon for hot-reloading changes during development
// see also: nodemon.json Windows+Docker dev HMR fix (WATCHPACK_POLLING)
import http from "node:http";
import { parse } from "node:url";
import next from "next";

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// needed for HMR with a custom server
const upgrade = (app as any).getUpgradeHandler?.();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  if (upgrade) server.on("upgrade", upgrade);

  server.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port} as ${dev ? "development" : process.env.NODE_ENV}`);
  });
});
