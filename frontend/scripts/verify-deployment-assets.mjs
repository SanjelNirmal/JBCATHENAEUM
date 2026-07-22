const input = process.argv[2];

if (!input) {
  throw new Error(
    "Usage: npm run verify:deployment -- https://jbc.nirmalsanjel.com.np",
  );
}

const origin = new URL(input).origin;
const assetPattern = /(?:^|["'`(=,])\/?(assets\/[A-Za-z0-9_.-]+\.(?:js|css|png|jpg|jpeg|svg|ico|woff2?))/g;
const discovered = new Set();
const pending = [];

function discover(contents) {
  for (const match of contents.matchAll(assetPattern)) {
    if (!discovered.has(match[1])) {
      discovered.add(match[1]);
      pending.push(match[1]);
    }
  }
}

const indexResponse = await fetch(`${origin}/?__asset_check=${Date.now()}`, {
  cache: "no-store",
  headers: { accept: "text/html" },
});

if (!indexResponse.ok || !indexResponse.headers.get("content-type")?.includes("text/html")) {
  throw new Error(`Deployment index returned ${indexResponse.status} ${indexResponse.headers.get("content-type") || "without a content type"}.`);
}

discover(await indexResponse.text());
const failures = [];
const missingAssetResponse = await fetch(
  `${origin}/assets/__jbc_missing_asset_check_${Date.now()}.js`,
  { cache: "no-store", headers: { accept: "application/javascript" } },
);

if (missingAssetResponse.ok) {
  failures.push(
    `missing asset fallback -> HTTP ${missingAssetResponse.status}, ${missingAssetResponse.headers.get("content-type") || "no content type"}; expected a non-2xx response`,
  );
}

while (pending.length) {
  const batch = pending.splice(0, 12);
  await Promise.all(
    batch.map(async (asset) => {
      const response = await fetch(`${origin}/${asset}`, {
        cache: "no-store",
        headers: { accept: asset.endsWith(".js") ? "application/javascript" : "*/*" },
      });
      const contentType = response.headers.get("content-type") || "";
      const expected = asset.endsWith(".js")
        ? "javascript"
        : asset.endsWith(".css")
          ? "text/css"
          : "";
      if (!response.ok || (expected && !contentType.includes(expected))) {
        failures.push(`${asset} -> HTTP ${response.status}, ${contentType || "no content type"}`);
        return;
      }
      if (asset.endsWith(".js") || asset.endsWith(".css")) discover(await response.text());
    }),
  );
}

if (failures.length) {
  throw new Error(
    `Deployment contains ${failures.length} missing or incorrectly served asset(s):\n${failures
      .sort()
      .map((failure) => `- ${failure}`)
      .join("\n")}`,
  );
}

console.log(`Verified ${discovered.size} deployed assets at ${origin}.`);
