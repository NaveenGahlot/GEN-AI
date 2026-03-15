import { GoogleGenAI } from "@google/genai";

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

export { generateInterviewReport };