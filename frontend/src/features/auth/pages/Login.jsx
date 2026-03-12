import React from 'react'
import '../auth.form.scss'
import { Link } from 'react-router'

const Login = () => {

    const handleSubmit = (e) =>{
        e.preventDefault()
    }
    return (
        <main>
            <div className='form-container'>
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className='input-group'>
                        <label htmlFor="email">Email</label>
                        <input type="email" id='email' name='email' placeholder='Enter your email'/>
                    </div>
                    <div className='input-group'>
                        <label htmlFor="password">Password</label>
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
