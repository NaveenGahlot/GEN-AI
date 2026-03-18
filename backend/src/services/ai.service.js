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

function formatParagraphs(text = "") {
    return text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");
}

function formatBulletItems(text = "", maxItems = 8) {
    const items = text
        .split(/\r?\n+/)
        .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, maxItems);

    if (!items.length) {
        return "<li>Details not available.</li>";
    }

    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function buildResumeHtmlFallback({ resume, selfDescription, jobDescription }) {
    const summarySource = selfDescription?.trim() || resume?.trim() || "Candidate profile available on request.";
    const experienceItems = formatBulletItems(resume, 12);
    const jobFocusItems = formatBulletItems(jobDescription, 8);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resume</title>
    <style>
        :root {
            --ink: #1f2937;
            --muted: #526072;
            --accent: #0f766e;
            --border: #d6dde5;
            --surface: #f7fafc;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            color: var(--ink);
            background: white;
            line-height: 1.45;
        }
        .page {
            padding: 24px 12px;
        }
        .resume {
            max-width: 820px;
            margin: 0 auto;
            border: 1px solid var(--border);
            padding: 32px;
            background: linear-gradient(180deg, white 0%, var(--surface) 100%);
        }
        h1, h2 { margin: 0; }
        h1 {
            font-size: 28px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .tagline {
            margin-top: 8px;
            color: var(--accent);
            font-weight: 600;
        }
        section {
            margin-top: 24px;
        }
        h2 {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--accent);
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--border);
        }
        p {
            margin: 0 0 10px;
            color: var(--muted);
            white-space: pre-wrap;
        }
        ul {
            margin: 0;
            padding-left: 18px;
        }
        li {
            margin-bottom: 8px;
            color: var(--muted);
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="resume">
            <header>
                <h1>Professional Resume</h1>
                <div class="tagline">Tailored resume PDF generated from available candidate and job data.</div>
            </header>

            <section>
                <h2>Professional Summary</h2>
                ${formatParagraphs(summarySource)}
            </section>

            <section>
                <h2>Relevant Experience</h2>
                <ul>${experienceItems}</ul>
            </section>

            <section>
                <h2>Target Role Alignment</h2>
                <ul>${jobFocusItems}</ul>
            </section>

            <section>
                <h2>Additional Notes</h2>
                ${formatParagraphs(resume)}
            </section>
        </div>
    </div>
</body>
</html>`;
}


async function generateResumePdf({ resume, selfDescription, jobDescription }){
    const client = getAiClient();
    const resumePdfSchema = {
        type: "OBJECT",
        properties: {
            html: {
                type: "STRING",
                description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer"
            }
        },
        required: ["html"]
    }

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `
    let htmlContent;

    try {
        const response = await generateContentWithRetry(client, {
            model: DEFAULT_GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumePdfSchema,
            }
        });
        const jsonContent = parseJsonResponse(response, "Failed to generate resume content.");
        htmlContent = jsonContent.html;
    } catch (error) {
        if (error instanceof AppError && error.statusCode === 429) {
            htmlContent = buildResumeHtmlFallback({ resume, selfDescription, jobDescription });
        } else {
            throw error;
        }
    }

    return await generatePdfFromHtml(htmlContent);
}

export { generateInterviewReport, generateResumePdf };
