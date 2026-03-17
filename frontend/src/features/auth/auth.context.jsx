import { createContext, useEffect, useState } from "react"; 
import { getMe } from "./services/auth.api";
import { getAuthToken } from "../../lib/authToken";

export const AuthContext = createContext()

export const AuthProvider = ({ children })=>{
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const bootstrapAuth = async () => {
            const token = getAuthToken()

            if (!token) {
                if (isMounted) {
                    setUser(null)
                    setLoading(false)
                }
                return
            }

            try {
                const data = await getMe()
                if (!isMounted) return
                setUser(data?.user || null)
            } catch {
                if (!isMounted) return
                setUser(null)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        bootstrapAuth()

        return () => {
            isMounted = false
        }
    }, [])


    return(
        <AuthContext.Provider value={{user, setUser, loading, setLoading}}>
            {children}
        </AuthContext.Provider>
    )
}
