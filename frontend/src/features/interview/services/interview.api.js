import axios from "axios";
import { clearAuthToken, getAuthToken } from "../../../lib/authToken";


const api = axios.create({
    baseURL: "https://roleplay-ai-rob1.onrender.com/",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearAuthToken()
        }
        return Promise.reject(error)
    }
)

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async({jobDescription, selfDescription, resumeFile})=>{
    const formData = new FormData()
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
    formData.append("resume", resumeFile);

    const response = await api.post("/api/interviews/", formData, {
        headers:{
            "Content-Type": "multipart/form-data"
        }
    })
    return response.data
}

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async(interviewId)=>{
    const response = await api.get(`/api/interviews/report/${interviewId}`);
    return response.data    
}

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewRepots = async()=>{
    const response = await api.get("/api/interviews/");
    return response.data
}

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interviews/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}
