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

async function generateResumePdf({ resume, selfDescription, jobDescription }){
    if (!ai) {
        ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        });
    }

    const resumePdfSchema = {
        type: "OBJECT",
        properties: {
            html: {
                type: "STRING",
                description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer"
            }
        },
        required: ["html"]
    };

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
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumePdfSchema,
        }
    })

    const jsonContent = JSON.parse(response.text)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

export { generateInterviewReport, generateResumePdf };
