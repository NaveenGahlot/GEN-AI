import React, { useState } from 'react'
import '../auth.form.scss'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const { loading, handleLogin} = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async(e) =>{
        e.preventDefault()
        await handleLogin({email, password})
        navigate('/')
    }
    if(loading){
        return (
            <main><h1>Loading...</h1></main>
        )
    }
    return (
        <main>
            <div className='form-container'>
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className='input-group'>
                        <label onChange={(e)=>{setEmail(e.target.value)}} htmlFor="email">Email</label>
                        <input type="email" id='email' name='email' placeholder='Enter your email'/>
                    </div>
                    <div className='input-group'>
                        <label onChange={(e)=>{setPassword(e.target.value)}} htmlFor="password">Password</label>
                        <input type="password" id='password' name='password' placeholder='Enter your password'/>
                    </div>
                    <button className='button primary-button' type='submit'>Log in</button>
                </form>
                <p>You Don't have Accout ? <Link to={"/register"}>Signup</Link></p>
            </div>
        </main>
    )
}

export default Login
