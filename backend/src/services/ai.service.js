import { GoogleGenAI } from "@google/genai";
import puppeteer from 'puppeteer'
import z from 'zod'

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// We will instantiate this inside the function so dotenv has time to load it first
let ai;

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
    if (!ai) {
        ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        });
    }

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
                `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportSchema,
        }
    });
    return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    })

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } finally {
        await browser.close()
    }
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeLines(text = "") {
    return String(text)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function buildResumeHtml({ resume, selfDescription, jobDescription }) {
    const resumeLines = normalizeLines(resume);
    const jobLines = normalizeLines(jobDescription);
    const summaryLines = normalizeLines(selfDescription);

    const heading = resumeLines[0] || "Professional Resume";
    const subheading = resumeLines[1] || "Candidate Profile";
    const coreHighlights = resumeLines.slice(2, 10);
    const jobHighlights = jobLines.slice(0, 8);
    const profileSummary = summaryLines.length > 0
        ? summaryLines
        : ["Experienced professional with relevant background aligned to the target role."];

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${escapeHtml(heading)}</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #1f2937;
                    background: #ffffff;
                    line-height: 1.5;
                    font-size: 12px;
                }
                .page {
                    padding: 28px 32px;
                }
                .header {
                    border-bottom: 3px solid #0f766e;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    color: #0f172a;
                }
                .header p {
                    margin: 6px 0 0;
                    color: #475569;
                    font-size: 14px;
                }
                .section {
                    margin-bottom: 18px;
                }
                .section h2 {
                    margin: 0 0 8px;
                    font-size: 15px;
                    color: #0f766e;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .section p {
                    margin: 0 0 8px;
                    white-space: pre-wrap;
                }
                ul {
                    margin: 0;
                    padding-left: 18px;
                }
                li {
                    margin-bottom: 6px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                }
                .muted {
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <main class="page">
                <header class="header">
                    <h1>${escapeHtml(heading)}</h1>
                    <p>${escapeHtml(subheading)}</p>
                </header>

                <section class="section">
                    <h2>Professional Summary</h2>
                    ${profileSummary.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
                </section>

                <section class="section grid">
                    <div>
                        <h2>Resume Highlights</h2>
                        <ul>
                            ${coreHighlights.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
                        </ul>
                    </div>
                    <div>
                        <h2>Target Role Focus</h2>
                        <ul>
                            ${jobHighlights.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
                        </ul>
                    </div>
                </section>

                <section class="section">
                    <h2>Detailed Background</h2>
                    <p>${escapeHtml(resumeLines.join("\n"))}</p>
                </section>

                <section class="section">
                    <h2>Role Alignment Notes</h2>
                    <p class="muted">${escapeHtml(jobLines.join("\n"))}</p>
                </section>
            </main>
        </body>
        </html>
    `;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }){
    const htmlContent = buildResumeHtml({ resume, selfDescription, jobDescription })
    return generatePdfFromHtml(htmlContent)
}

export { generateInterviewReport, generateResumePdf };
