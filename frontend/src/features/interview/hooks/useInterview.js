import { useContext } from "react"
import { toast } from "react-toastify"
import { InterviewContext } from "../interview.context"
import { generateInterviewReport, generateResumePdf, getAllInterviewRepots, getInterviewReportById } from "../services/interview.api";


export const useInterview = () =>{
    const context = useContext(InterviewContext);

    if(!context){
        throw new Error("userInterview must be used within an InterviewProvider")
    }
    const { loading, setLoading, report, setReport, reports, setReports } = context;
    const generateReport = async ({jobDescription, selfDescription, resumeFile}) =>{
        setLoading(true)
        let response = null
        try{
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                toast.success('Interview strategy generated successfully!')
                return response.interviewReport
            }
            toast.info('No report returned from the server.')
            return null
        }catch(error){
            const errMsg = error?.response?.data?.message || error?.message || 'Failed to generate interview report.'
            toast.error(errMsg)
            console.log(error)
            return null
        }finally{
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
            toast.info('Interview report not found.')
            return null
        } catch (error) {
            const errMsg = error?.response?.data?.message || error?.message || 'Failed to fetch interview report.'
            toast.error(errMsg)
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewRepots()
            if (response && Array.isArray(response.interviewReports)) {
                setReports(response.interviewReports)
                return response.interviewReports
            }
            toast.info('No interview reports available yet.')
            setReports([])
            return []
        } catch (error) {
            const errMsg = error?.response?.data?.message || error?.message || 'Failed to load reports.'
            toast.error(errMsg)
            console.log(error)
            setReports([])
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            toast.success('Resume PDF downloaded successfully.')
        }
        catch (error) {
            const errMsg = error?.response?.data?.message || error?.message || 'Failed to generate resume PDF.'
            toast.error(errMsg)
            console.log(error)
        } finally {
            setLoading(false)
        }
    }


    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }
}