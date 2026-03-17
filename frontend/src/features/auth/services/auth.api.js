import axios from 'axios'
import { clearAuthToken, getAuthToken } from '../../../lib/authToken'

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

export async function register({username, email, password}){
    const response = await api.post('/api/auths/register',{
        username, email, password
    })
    return response.data
}

export async function login({email, password}){
    const response = await api.post('/api/auths/login',{
        email, password
    })
    return response.data
}

export async function logout(){
    try{
        const response = await api.get('/api/auths/logout')
        return response.data
    }catch(err){
        console.log(err)
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auths/get-me')
        return response.data
    } catch (err) {
        if (err.response && err.response.status === 401) {
            return null
        }
        console.log(err)
        throw err
    }
}
