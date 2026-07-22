import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";

const root = resolve(process.cwd(), process.argv[2] || "dist");
const indexPath = resolve(root, "index.html");
const notFoundPath = resolve(root, "404.html");

if (!existsSync(indexPath)) {
  throw new Error(`Production index was not found at ${indexPath}`);
}
if (!existsSync(notFoundPath)) {
  throw new Error(
    "Production 404.html is missing; Cloudflare Pages would serve index.html for missing JavaScript chunks.",
  );
}

function filesIn(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const inspectable = filesIn(root).filter((path) => /\.(?:html|js|css)$/.test(path));
const referencedAssets = new Set();
const assetPattern = /(?:^|["'`(=,])\/?(assets\/[A-Za-z0-9_.-]+\.(?:js|css|png|jpg|jpeg|svg|ico|woff2?))/g;

for (const path of inspectable) {
  const contents = readFileSync(path, "utf8");
  for (const match of contents.matchAll(assetPattern)) referencedAssets.add(match[1]);
}

const missing = [...referencedAssets].filter((asset) => !existsSync(resolve(root, asset)));

if (missing.length) {
  throw new Error(
    `Production build references ${missing.length} missing asset(s):\n${missing
      .map((asset) => `- ${asset}`)
      .join("\n")}`,
  );
}

console.log(
  `Verified ${referencedAssets.size} referenced production assets across ${inspectable.length} files in ${relative(process.cwd(), root) || "."}.`,
);
