import express from "express";

const interviewRouter = express.Router()

/**
 * @route POST /api/interviews
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */


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