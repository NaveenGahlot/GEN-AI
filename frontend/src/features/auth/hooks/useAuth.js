import { useContext } from "react"
import { toast } from "react-toastify"
import { AuthContext } from "../auth.context"
import { login, logout, register } from "../services/auth.api"
import { clearAuthToken, setAuthToken } from "../../../lib/authToken"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context
    // handleLogin
    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setAuthToken(data?.token)
            setUser(data.user)
            toast.success('Login successful. Welcome!')
            return true
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || 'Login failed.'
            toast.error(errMsg)
            return false
        } finally {
            setLoading(false)
        }
    }
      // handleRegister 
    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setAuthToken(data?.token)
            setUser(data.user)
            toast.success('Signup successful. You are now logged in.')
            return true
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || 'Signup failed.'
            toast.error(errMsg)
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            clearAuthToken()
            toast.info('Logged out successfully.')
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || 'Logout failed.'
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return { user, loading, handleLogin, handleRegister, handleLogout }
}
