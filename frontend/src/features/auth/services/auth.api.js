import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true
})

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