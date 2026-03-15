import express from "express";
import authenticateUser from "../middlewares/auth.middleware.js";
import { generateInterviewReportController } from "../controllers/interview.controller.js";
import upload from "../middlewares/file.middleware.js";

const interviewRouter = express.Router()

/**
 * @route POST /api/interviews
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authenticateUser, upload.single("resume"), generateInterviewReportController)

/**
 * @route GET /api/interviews/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */


/**
 * @route GET /api/interviews/
 * @description get all interview reports of logged in user.
 * @access private
 */


/**
 * @route GET /api/interviews/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */

export default interviewRouter;