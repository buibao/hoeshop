import { spawn } from "node:child_process";

// Empty strings must reach Next as actual environment entries. PowerShell removes
// variables assigned '', allowing .env.local's Preview credentials to be reloaded.
if (process.env.VERCEL || process.env.VERCEL_ENV) throw new Error("Run this fixture launcher locally.");
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 3000;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local port.");
const build = process.argv.includes("--build"), serve = process.argv.includes("--serve"), webpack = process.argv.includes("--webpack");
const env = {
  ...process.env,
  DATABASE_URL: "", DATABASE_URL_UNPOOLED: "", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
  CLERK_SECRET_KEY: "", ADMIN_CLERK_USER_IDS: "", BLOB_READ_WRITE_TOKEN: "",
  VERCEL: "", VERCEL_ENV: "", CONTENT_MODE: "test", DATA_ADAPTER: "mock", DB_ENV: "test",
  RATE_LIMIT_SECRET: "local-fixture-tests-only", SITE_URL: `http://localhost:${port}`,
  NEXT_DIST_DIR: build || serve ? ".next-feedback" : port === 3100 ? ".next-e2e" : ".next",
};
const child = build
  ? spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build", ...(webpack ? ["--", "--webpack"] : [])], { env, stdio: "inherit", shell: process.platform === "win32" })
  : spawn(process.execPath, ["node_modules/next/dist/bin/next", serve ? "start" : "dev", "--port", String(port), ...(!serve && webpack ? ["--webpack"] : [])], { env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
