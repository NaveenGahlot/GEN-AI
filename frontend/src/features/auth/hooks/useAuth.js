import { useContext, useEffect } from "react"
import { toast } from "react-toastify"
import { AuthContext } from "../auth.context"
import { getMe, login, logout, register } from "../services/auth.api"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
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

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
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
            const data = await logout()
            setUser(null)
            toast.info('Logged out successfully.')
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || 'Logout failed.'
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return { user, loading, handleLogin, handleRegister, handleLogout }
}