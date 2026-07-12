import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL: "file:./test.db",
  NEXTAUTH_SECRET: "transitops-test-secret"
};

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npx", ["tsx", "scripts/init-db.ts"]);
run("npx", ["vitest", "run"]);
