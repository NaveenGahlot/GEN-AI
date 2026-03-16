import { PDFParse } from 'pdf-parse';
import { generateInterviewReport, generateResumePdf } from '../services/ai.service.js';
import { interviewReportModel } from '../models/interviewReport.model.js';


/**
 * @description Controller to generate interview report basaed on user self         description, resume and jobDescription.
 */

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

/**
 * @description Controller to get interview report by interviewId.
 */
export const getInterviewReportByIdController = async(req, res)=>{
    const { interviewId } = req.params;
    const interviewReport = await interviewReportModel.findOne({_id: interviewId, user: req.user.id})

    if(!interviewReport){
        return res.status(404).json({
            message: "interview report not found."
        })
    }
    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
export const getAllInterviewReportController = async(req, res)=>{
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
export const generateResumePdfController = async(req, res) => {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}