import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { createJiti } from "jiti";

/**
 * .env.extra: значения применяются только к НЕзаданным переменным
 * (локальный .env и e2e окружение не перекрываются прод-секретами).
 */
const jiti = createJiti(import.meta.url);

test("extra env fills missing keys and never overrides existing ones", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bunker-env-extra-"));
  const previousCwd = process.cwd();
  process.env.ENV_EXTRA_EXISTING = "from-env";
  delete process.env.ENV_EXTRA_MISSING;
  try {
    writeFileSync(
      join(dir, ".env.extra"),
      [
        "# комментарий",
        "ENV_EXTRA_EXISTING=from-file",
        "ENV_EXTRA_MISSING=from-file",
        "lowercase_ignore=1",
        'ENV_EXTRA_QUOTED="quoted value"',
        "MALFORMED LINE",
      ].join("\n"),
    );
    process.chdir(dir);
    const { loadExtraEnv, resetExtraEnvForTests } = await jiti.import(
      "../server/utils/env-extra.ts",
    );
    resetExtraEnvForTests();
    loadExtraEnv();
    assert.equal(process.env.ENV_EXTRA_EXISTING, "from-env");
    assert.equal(process.env.ENV_EXTRA_MISSING, "from-file");
    assert.equal(process.env.ENV_EXTRA_QUOTED, "quoted value");
    assert.equal(process.env.lowercase_ignore, undefined);
    // повторный вызов — no-op (идемпотентность)
    loadExtraEnv();
    assert.equal(process.env.ENV_EXTRA_EXISTING, "from-env");
  } finally {
    process.chdir(previousCwd);
    rmSync(dir, { recursive: true, force: true });
    delete process.env.ENV_EXTRA_EXISTING;
    delete process.env.ENV_EXTRA_MISSING;
    delete process.env.ENV_EXTRA_QUOTED;
  }
});
