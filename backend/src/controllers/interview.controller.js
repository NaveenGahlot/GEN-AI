import { PDFParse } from 'pdf-parse';
import { generateInterviewReport } from '../services/ai.service.js';
import { interviewReportModel } from '../models/interviewReport.model.js';

export const generateInterviewReportController = async (req, res) => {
    try {
        // Validate that a resume file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "Resume PDF file is required" });
        }

        // Validate required body fields
        const { selfDescription, jobDescription } = req.body;
        if (!selfDescription || !jobDescription) {
            return res.status(400).json({ message: "selfDescription and jobDescription are required" });
        }

        // Initialize parser with buffer data
        const parser = new PDFParse({ data: req.file.buffer });

        // Extract plain text
        const textResult = await parser.getText();
        const resumeText = textResult.text;

        // Cleanup parser
        await parser.destroy();

        // Generate interview report using AI
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // Save the report to the database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        });

        res.status(201).json({ message: "Interview report generated successfully", interviewReport });

    } catch (err) {
        console.error("Error generating interview report:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};