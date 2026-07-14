import { $ } from "bun";

console.log("Preparing to deploy main Astro site to Cloudflare Pages...");

try {
  console.log("Checking Wrangler authentication...");
  const authCheck = await $`bunx wrangler whoami`.nothrow().quiet();
  if (authCheck.exitCode !== 0 || authCheck.stdout.toString().includes("You are not authenticated")) {
    console.log("\n⚠️  You are not authenticated with Cloudflare.");
    console.log("Please run the following command in your terminal to log in:");
    console.log("  bunx wrangler login");
    console.log("\nOnce authenticated, re-run this deploy script.\n");
    process.exit(1);
  }

  console.log("Building the Astro site...");
  await $`pnpm --dir main run build`;

  console.log("Deploying to Cloudflare Pages...");
  await $`bunx wrangler pages deploy main/dist --project-name=flumenlabs-apex`;

  console.log("🎉 Main Astro landing page deployed successfully!");
  console.log("Make sure to map the custom domain 'flumenlabs.eu' to this project in your Cloudflare Pages dashboard.");
} catch (err) {
  console.error("Failed to deploy Main Astro site:", err);
  process.exit(1);
}
