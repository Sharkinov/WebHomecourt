// import { useState } from 'react'
import { LeftSide, RightSide } from '../components/Registro/laterales'
import { useNavigate } from 'react-router-dom'
import Button from '../components/button.tsx'
import GoogleButton from '../components/botongoogle.tsx'
import StatusAlert from '../components/Messages/StatusAlert.tsx'
import { useRegister } from "../hooks/useRegister"

function Register() {
  const navigate = useNavigate()
  const {email, setEmail, touchEmail, password, setPassword, touchPassword, confirmPassword, setConfirmPassword,
           touchConfirmPassword, loading, alert, emailError, passwordError, register,} = useRegister()
  const handleRegisterClick = async () => {
    const ok = await register()
    if (ok) navigate("/complete-register")
  }

  return (
    <div className="relative min-h-screen bg-zinc-100 flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 right-0 hidden md:block">
        <LeftSide />
      </div>

      <div className="absolute bottom-0 left-0 hidden md:block">
        <RightSide />
      </div>
      <div className="relative flex flex-col items-center w-full max-w-sm px-8 py-10">
        <img
          src="/lakers_homecourt.png"
          alt="Lakers Homecourt"
          className="h-16 object-contain mb-6"
        />
        <h1 className="text-morado-lakers mb-1 text-center">Hi, new fan!</h1>
        <p className="text-gray-600 mb-6">Become part of the Laker family.</p>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={touchEmail}
              className={`h-11 px-4 bg-white rounded-2xl text-zinc-500 focus:outline-2 ${
                emailError ? "outline-orange-800" : "focus:outline-morado-lakers"
              }`}
            />
            {emailError && (
              <div className="mt-2">
                <StatusAlert tone="warning" title={emailError}/>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={touchPassword}
              required
              className="h-11 px-4 bg-white rounded-2xl text-zinc-500 focus:outline-2 focus:outline-morado-lakers"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>Confirm password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onBlur={touchConfirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 px-4 bg-white rounded-2xl text-zinc-500 focus:outline-2 focus:outline-morado-lakers"
            />
            {passwordError && (
              <div className="mt-2">
                <StatusAlert tone="warning" title={passwordError} />
              </div>
            )}
          </div>
          <Button
            text={loading ? "Signing-up" : "Continue"}
            type="primary"
            onClick={handleRegisterClick}
            className="w-full text-g !py-2"
            // disabled={!canSubmit}
          />
          {alert && (
            <div className="mt-2">
              <StatusAlert tone={alert.tone} title={alert.message} />
            </div>
          )}
          <div className="flex items-center w-full my-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-morado-lakers font-semibold text-sm">
              Or
            </span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          <GoogleButton></GoogleButton>
        </div>
        <div className="inline-flex items-center gap-2.5 mt-4">
          <p className="text-morado-lakers text-lg font-semibold">Already have an account?</p>
          <a href="/login" className="text-morado-bajo text-lg font-semibold underline hover:text-morado-lakers">Sign In</a>
        </div>
      </div>
    </div>
  )
}

export default Register