import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'

const Protected = ({ children }) => {
    const { loading, user } = useAuth()
    const navigate = useNavigate()

    React.useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true })
        }
    }, [loading, user, navigate])

    if (loading) {
        return (
            <main><h1>Loading...</h1></main>
        )
    }

    if (!user) {
        return null
    }
    
    return children
}

export default Protected
