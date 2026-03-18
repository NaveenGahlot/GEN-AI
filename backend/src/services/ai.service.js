import { GoogleGenAI } from "@google/genai"; 
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import puppeteer from 'puppeteer'

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// We will instantiate this inside the function so dotenv has time to load it first
let ai;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

class AppError extends Error {
    constructor(message, statusCode, options = {}) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        Object.assign(this, options);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseGeminiError(error) {
    const rawMessage = error?.message || "Unknown AI service error";
    let parsedError = null;

    try {
        parsedError = JSON.parse(rawMessage);
    } catch {
        parsedError = null;
    }

    const apiError = parsedError?.error;
    const retryInfo = apiError?.details?.find((detail) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
    const retryDelay = retryInfo?.retryDelay;
    const retryAfterSeconds = retryDelay ? Number.parseInt(retryDelay.replace("s", ""), 10) : null;
    const isQuotaError =
        apiError?.code === 429 ||
        apiError?.status === "RESOURCE_EXHAUSTED" ||
        /RESOURCE_EXHAUSTED|quota/i.test(rawMessage);

    return {
        isQuotaError,
        rawMessage,
        message: apiError?.message || rawMessage,
        retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null
    };
}

async function generateContentWithRetry(client, requestConfig) {
    try {
        return await client.models.generateContent(requestConfig);
    } catch (error) {
        const parsed = parseGeminiError(error);

        if (parsed.isQuotaError && parsed.retryAfterSeconds && parsed.retryAfterSeconds <= 30) {
            await sleep(parsed.retryAfterSeconds * 1000);
            try {
                return await client.models.generateContent(requestConfig);
            } catch (retryError) {
                const retriedParsed = parseGeminiError(retryError);

                if (retriedParsed.isQuotaError) {
                    throw new AppError("Gemini API quota exceeded. Please wait and try again later, or upgrade your Gemini API plan.", 429, {
                        error: retriedParsed.message,
                        retryAfterSeconds: retriedParsed.retryAfterSeconds
                    });
                }

                throw retryError;
            }
        }

        if (parsed.isQuotaError) {
            throw new AppError("Gemini API quota exceeded. Please wait and try again later, or upgrade your Gemini API plan.", 429, {
                error: parsed.message,
                retryAfterSeconds: parsed.retryAfterSeconds
            });
        }

        throw error;
    }
}

function getAiClient() {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("GOOGLE_GENAI_API_KEY is not configured");
    }

    if (!ai) {
        ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        });
    }

    return ai;
}

function parseJsonResponse(response, fallbackMessage) {
    if (!response?.text) {
        throw new AppError(fallbackMessage, 502, {
            error: "The AI service returned an empty response."
        });
    }

    try {
        return JSON.parse(response.text);
    } catch (error) {
        throw new AppError(fallbackMessage, 502, {
            error: error.message,
            rawResponse: response.text
        });
    }
}

// Use native JSON schema configuration instead of zod-to-json-schema to avoid parsing bugs
const interviewReportSchema = {
    type: "OBJECT",
    properties: {
        matchScore: { type: "INTEGER", description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description" },
        technicalQuestion: {
            type: "ARRAY",
            description: "Technical questions that can be asked in the interview",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The technical question that can be asked" },
                    intention: { type: "STRING", description: "The intention of the interviewer" },
                    answer: { type: "STRING", description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestion: {
            type: "ARRAY",
            description: "Behavioral questions that can be asked",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The behavioral question that can be asked" },
                    intention: { type: "STRING", description: "The intention of the interviewer" },
                    answer: { type: "STRING", description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "ARRAY",
            description: "List of skill gaps",
            items: {
                type: "OBJECT",
                properties: {
                    skill: { type: "STRING", description: "The skill which the candidate is lacking" },
                    severity: { type: "STRING", description: "low, medium, or high", enum: ["low", "medium", "high"] }
                },
                required: ["skill", "severity"]
            }
        },
        preprationPlan: {
            type: "ARRAY",
            description: "A day-wise preparation plan",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "INTEGER", description: "The day number" },
                    focus: { type: "STRING", description: "The main focus of this day" },
                    tasks: { type: "ARRAY", description: "List of tasks to be done", items: { type: "STRING" } }
                },
                required: ["day", "focus", "tasks"]
            }
        },
        title: { type: "STRING", description: "The title of the job for which the interview report is generated" }
    },
    required: ["matchScore", "technicalQuestion", "behavioralQuestion", "skillGaps", "preprationPlan", "title"]
};

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const client = getAiClient();

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
                `

    const response = await generateContentWithRetry(client, {
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportSchema,
        }
    });
    return parseJsonResponse(response, "Failed to generate interview report.");
}

async function getBrowserLaunchOptions() {
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-pdf-chrome-"));

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            userDataDir
        };
    }

    if (process.env.NODE_ENV === "production") {
        try {
            const { default: chromium } = await import("@sparticuz/chromium");
            const executablePath = await chromium.executablePath();

            return {
                executablePath,
                args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
                headless: "shell",
                userDataDir
            };
        } catch (error) {
            if (error?.code !== "ERR_MODULE_NOT_FOUND") {
                throw error;
            }
        }
    }

    return {
        executablePath: puppeteer.executablePath(),
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        userDataDir
    };
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeResumeLines(text = "") {
    return text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
}

function isSectionHeading(line = "") {
    const cleaned = line.replace(/[^A-Za-z\s&/-]/g, "").trim();

    return cleaned.length >= 3 && cleaned.length <= 40 && cleaned === cleaned.toUpperCase();
}

function formatParagraphs(text = "") {
    return normalizeResumeLines(text)
        .map((line) => `<p>${formatInlineText(line)}</p>`)
        .join("");
}

function formatInlineText(text = "") {
    const escaped = escapeHtml(text);

    return escaped
        .replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank" rel="noreferrer">$1</a>'
        )
        .replace(
            /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi,
            '<a href="mailto:$1">$1</a>'
        )
        .replace(
            /(^|\s)(linkedin\.com\/[^\s<]+|github\.com\/[^\s<]+)/gi,
            '$1<a href="https://$2" target="_blank" rel="noreferrer">$2</a>'
        );
}

function buildAnchor(href, label) {
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function inferProfileLink(token = "") {
    const value = token.trim().replace(/^[|,:;]+|[|,:;]+$/g, "");

    if (!value) {
        return null;
    }

    if (/^https?:\/\//i.test(value)) {
        return { href: value, label: value.replace(/^https?:\/\//i, "") };
    }

    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return { href: `mailto:${value}`, label: value };
    }

    if (/^\+?[\d\s()-]{8,}$/.test(value)) {
        return { href: `tel:${value.replace(/[^\d+]/g, "")}`, label: value };
    }

    if (/^@[A-Za-z0-9_]+$/.test(value)) {
        const username = value.slice(1);
        return { href: `https://github.com/${username}`, label: `github.com/${username}` };
    }

    if (/^(?:linkedin\/|linkedin:)/i.test(value)) {
        const slug = value.replace(/^(?:linkedin\/|linkedin:)/i, "").replace(/^in\//i, "").replace(/\/+$/g, "");
        return { href: `https://www.linkedin.com/in/${slug}/`, label: `linkedin.com/in/${slug}` };
    }

    if (/^[A-Za-z0-9-]+$/.test(value) && value.includes("-")) {
        const slug = value.replace(/\/+$/g, "");
        return { href: `https://www.linkedin.com/in/${slug}/`, label: `linkedin.com/in/${slug}` };
    }

    if (/^linkedin\.com\/.+/i.test(value)) {
        const normalized = value.replace(/^linkedin\.com\/in\/?/i, "").replace(/\/+$/g, "");
        return { href: `https://www.linkedin.com/in/${normalized}/`, label: `linkedin.com/in/${normalized}` };
    }

    if (/^github\.com\/.+/i.test(value)) {
        return { href: `https://${value}`, label: value };
    }

    return { href: null, label: value };
}

function parseResumeContent(resume = "") {
    const lines = normalizeResumeLines(resume);
    const parsed = {
        name: lines[0] || "Candidate Name",
        contact: [],
        sections: []
    };

    let index = 1;
    while (index < lines.length && !isSectionHeading(lines[index])) {
        parsed.contact.push(lines[index]);
        index += 1;
    }

    let currentSection = null;

    for (; index < lines.length; index += 1) {
        const line = lines[index];

        if (isSectionHeading(line)) {
            if (currentSection) {
                parsed.sections.push(currentSection);
            }

            currentSection = { title: line, items: [] };
            continue;
        }

        if (currentSection) {
            currentSection.items.push(line);
        }
    }

    if (currentSection) {
        parsed.sections.push(currentSection);
    }

    return parsed;
}

function parseSectionEntries(items = []) {
    const groups = [];
    let currentGroup = null;

    for (const item of items) {
        const isBulletStart = /^[❖•*-]\s*/.test(item);

        if (isBulletStart || !currentGroup) {
            currentGroup = {
                title: item.replace(/^[❖•*-]\s*/, ""),
                lines: []
            };
            groups.push(currentGroup);
            continue;
        }

        currentGroup.lines.push(item);
    }

    if (!groups.length) {
        return items.map((item) => ({
            title: item,
            lines: []
        }));
    }

    return groups;
}

function buildSkillsMarkup(section) {
    const entries = parseSectionEntries(section.items);

    return `
        <div class="skill-grid">
            ${entries.map((entry) => {
                const heading = entry.title.replace(/^[❖•*-]\s*/, "").replace(/:-$/, "").trim();
                const values = [heading.includes(":") ? heading.split(":").slice(1).join(":").trim() : "", ...entry.lines]
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim();
                const label = heading.includes(":") ? heading.split(":")[0].trim() : heading;

                return `
                    <div class="skill-row">
                        <div class="skill-label">${escapeHtml(label)}</div>
                        <div class="skill-value">${formatInlineText(values || label)}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function buildGeneralEntriesMarkup(section) {
    const entries = parseSectionEntries(section.items);

    return entries.map((entry) => {
        const title = entry.title.replace(/\s+\|/g, " |").replace(/:-$/, "").trim();
        const body = entry.lines.length
            ? `<div class="entry-body">${entry.lines.map((line) => `<p>${formatInlineText(line)}</p>`).join("")}</div>`
            : "";

        return `
            <article class="entry">
                <div class="entry-title">${formatInlineText(title)}</div>
                ${body}
            </article>
        `;
    }).join("");
}

function buildSectionMarkup(section) {
    if (/^SKILLS$/i.test(section.title)) {
        return buildSkillsMarkup(section);
    }

    return buildGeneralEntriesMarkup(section);
}

function parseContactLine(contactLines = []) {
    const combined = contactLines.join(" ").replace(/\s+/g, " ").trim();
    const items = [];
    const seen = new Set();

    const pushItem = (value) => {
        const inferred = inferProfileLink(value);

        if (!inferred?.label) {
            return;
        }

        const key = `${inferred.href || "text"}::${inferred.label}`;
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        items.push(inferred);
    };

    const emailMatch = combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) {
        pushItem(emailMatch[0]);
    }

    const phoneMatch = combined.match(/(?:\+\d{1,3}\s*)?(?:\(?\d{2,5}\)?[\s-]*){2,}\d{2,5}/);
    if (phoneMatch) {
        pushItem(phoneMatch[0].trim());
    }

    for (const match of combined.matchAll(/https?:\/\/[^\s|,]+/gi)) {
        pushItem(match[0]);
    }

    for (const match of combined.matchAll(/(?:linkedin\.com\/[^\s|,]+|github\.com\/[^\s|,]+)/gi)) {
        pushItem(match[0]);
    }

    for (const match of combined.matchAll(/@[A-Za-z0-9_]+/g)) {
        pushItem(match[0]);
    }

    for (const match of combined.matchAll(/\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+){1,}\b/g)) {
        if (!/^\+?\d/.test(match[0])) {
            pushItem(match[0]);
        }
    }

    return items;
}

function buildResumeHtml({ resume, selfDescription, jobDescription }) {
    const parsedResume = parseResumeContent(resume);
    const summary = selfDescription?.trim() || "";
    const sectionsMarkup = parsedResume.sections.length
        ? parsedResume.sections.map((section) => `
            <section>
                <h2>${escapeHtml(section.title)}</h2>
                ${buildSectionMarkup(section)}
            </section>
        `).join("")
        : `
            <section>
                <h2>RESUME</h2>
                ${formatParagraphs(resume)}
            </section>
        `;
    const contactItems = parseContactLine(parsedResume.contact);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resume</title>
    <style>
        :root {
            --ink: #111827;
            --muted: #374151;
            --border: #d1d5db;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: #f5f7fb;
            color: var(--ink);
            font-family: "Georgia", "Times New Roman", serif;
            font-size: 12px;
            line-height: 1.45;
        }
        .page {
            padding: 22px 14px;
        }
        .resume {
            max-width: 860px;
            margin: 0 auto;
            padding: 28px 34px;
            background: white;
            box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
        }
        header {
            text-align: center;
            border-bottom: 2px solid #1f2937;
            padding-bottom: 14px;
        }
        h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .contact {
            margin-top: 10px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px 16px;
            color: var(--muted);
            font-size: 11px;
        }
        .contact-item {
            white-space: nowrap;
        }
        .contact-item::after {
            content: "|";
            margin-left: 16px;
            color: #9ca3af;
        }
        .contact-item:last-child::after {
            content: "";
            margin: 0;
        }
        .contact a, a {
            color: #0f4c81;
            text-decoration: none;
        }
        .contact a:hover, a:hover {
            text-decoration: underline;
        }
        section {
            margin-top: 18px;
        }
        h2 {
            margin: 0 0 12px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            border-bottom: 1px solid var(--border);
            padding-bottom: 4px;
        }
        p {
            margin: 0 0 6px;
            color: var(--muted);
        }
        .skill-grid {
            display: grid;
            gap: 10px;
        }
        .skill-row {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 12px;
            align-items: start;
        }
        .skill-label {
            font-weight: 700;
            color: var(--ink);
        }
        .skill-value {
            color: var(--muted);
        }
        .entry {
            margin-bottom: 12px;
        }
        .entry-title {
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 4px;
        }
        .entry-body {
            padding-left: 14px;
            border-left: 2px solid #e5e7eb;
        }
        .entry-body p:last-child {
            margin-bottom: 0;
        }
        @media print {
            body {
                background: white;
            }
            .page {
                padding: 0;
            }
            .resume {
                box-shadow: none;
                max-width: none;
                padding: 0;
            }
        }
        @media (max-width: 700px) {
            .resume {
                padding: 22px 18px;
            }
            .skill-row {
                grid-template-columns: 1fr;
                gap: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="resume">
            <header>
                <h1>${escapeHtml(parsedResume.name)}</h1>
                <div class="contact">
                    ${contactItems.map((item) => `
                        <span class="contact-item">
                            ${item.href ? buildAnchor(item.href, item.label) : escapeHtml(item.label)}
                        </span>
                    `).join("")}
                </div>
            </header>
            ${summary ? `
            <section>
                <h2>Professional Summary</h2>
                ${formatParagraphs(summary)}
            </section>` : ""}
            ${sectionsMarkup}
        </div>
    </div>
</body>
</html>`;
}

async function generatePdfFromHtml(htmlContent) {
    const launchOptions = await getBrowserLaunchOptions();
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            ...launchOptions
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        return await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        });
    } finally {
        if (browser) {
            await browser.close().catch(() => null);
        }

        if (launchOptions.userDataDir) {
            await fs.rm(launchOptions.userDataDir, { recursive: true, force: true }).catch(() => null);
        }
    }
}


async function generateResumePdf({ resume, selfDescription, jobDescription }){ 
    const htmlContent = buildResumeHtml({ resume, selfDescription, jobDescription });
    return await generatePdfFromHtml(htmlContent);
}

export { generateInterviewReport, generateResumePdf };
