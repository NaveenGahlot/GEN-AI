import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const cacheDir = process.env.PUPPETEER_CACHE_DIR || join(process.cwd(), ".cache", "puppeteer");

if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
}

try {
    execFileSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["puppeteer", "browsers", "install", "chrome"],
        {
            stdio: "inherit",
            env: {
                ...process.env,
                PUPPETEER_CACHE_DIR: cacheDir
            }
        }
    );
} catch (error) {
    console.error("Failed to install Chrome for Puppeteer.");
    throw error;
}
