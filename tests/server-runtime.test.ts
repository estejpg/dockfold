import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const importPattern =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["'](\.{1,2}\/[^"']+)["']/g;

// Vercel compiles each function file separately and runs it as Node ESM, so
// every relative import must already name a file that exists after compilation.
function compileGraph(entry: string, outDir: string) {
  const problems: string[] = [];
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const relative = path.relative(root, file);
    const target = path.join(outDir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    if (file.endsWith(".json")) {
      copyFileSync(file, target);
      continue;
    }
    const source = readFileSync(file, "utf8");
    for (const [, specifier] of source.matchAll(importPattern)) {
      const resolved = path.resolve(path.dirname(file), specifier);
      if (specifier.endsWith(".json")) {
        if (!/with\s*\{\s*type:\s*["']json["']\s*\}/.test(source))
          problems.push(`${relative}: JSON import ${specifier} needs with { type: "json" }`);
        queue.push(resolved);
      } else if (specifier.endsWith(".js")) {
        const base = resolved.slice(0, -3);
        const candidate = [".ts", ".tsx", ".js"]
          .map((ext) => base + ext)
          .find((name) => existsSync(name));
        if (candidate) queue.push(candidate);
        else problems.push(`${relative}: ${specifier} does not exist`);
      } else {
        problems.push(`${relative}: ${specifier} needs an explicit .js extension`);
      }
    }
    const output = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    writeFileSync(target.replace(/\.tsx?$/, ".js"), output);
  }
  return problems;
}

test("the suggestion function loads under plain Node ESM, as deployed", () => {
  const outDir = mkdtempSync(path.join(tmpdir(), "dockfold-fn-"));
  try {
    writeFileSync(
      path.join(outDir, "package.json"),
      JSON.stringify({ type: "module" }),
    );
    const problems = compileGraph(path.join(root, "api/suggest.ts"), outDir);
    assert.deepEqual(problems, []);
    const script = `
      const mod = await import(${JSON.stringify(path.join(outDir, "api/suggest.js"))});
      const get = await mod.default.fetch(new Request("http://127.0.0.1/api/suggest"));
      const post = await mod.default.fetch(new Request("http://127.0.0.1/api/suggest", {
        method: "POST",
        headers: { origin: "http://127.0.0.1:5173", "content-type": "application/json" },
        body: JSON.stringify({ title: "Quiet", description: "A small Dock.", group: "everyday", apps: ["notes"] }),
      }));
      process.stdout.write(JSON.stringify({ get: get.status, post: post.status, body: await post.json() }));
    `;
    const env = { ...process.env };
    delete env.VERCEL;
    delete env.SUGGESTION_INBOX;
    delete env.RESEND_API_KEY;
    const result = JSON.parse(
      execFileSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: outDir,
        env,
        encoding: "utf8",
      }),
    );
    assert.equal(result.get, 405);
    assert.equal(result.post, 200);
    assert.equal(result.body.delivered, "copy");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
