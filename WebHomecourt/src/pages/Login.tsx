import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/button.tsx'
import { supabase } from "../lib/supabase"
//import { UserAuth } from "../context/AuthContext.tsx";
import GoogleButton from '../components/botongoogle.tsx'

function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); // Future allow username
  const [password, setPassword] = useState('');
  //const [error, setError] = useState('');
  const navigate = useNavigate();
  //const [user, setUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Checks fields are filled in, and does the login w supabase 
  const handleLogin = async () => {
    //setError('');
    setErrorMessage('');

    // Checks fields are filled in
    if (email == '' && password == '') {
      // No credentials
      setErrorMessage("Please provide your email and password");
    } else if (email == '') {
      setErrorMessage("Please provide your email");
    } else if (password == '') {
      setErrorMessage("Please provide your password");
    } else {
      // Filled everything in so tries to sign in now
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        //setError(error.message);
        console.log(`Error iniciando sesión ${error}`);
        setErrorMessage("Incorrect credentials");
      } else {
        //check if user is banned or suspended, if so, sign out and show error message
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data: userData } = await supabase
          .from('user_laker')
          .select('banned_until')
          .eq('user_id', user?.id)
          .single()

        if (userData?.banned_until && new Date(userData.banned_until) > new Date()) {
          await supabase.auth.signOut()
          setErrorMessage('Your account is suspended or banned.')
          return
        }

        navigate('/')
      }
    }
  };

  return (
    // Uses relative so that it calcs diff layout positions to this main div */}
    <div className="relative min-h-screen bg-zinc-100 flex items-center justify-center overflow-hidden">
      {/* Top right icon, dejando sin alt para q no disp nada si no se encuentra and absolute to set at aboslute top and abs right -0*/}
      <img src="/top_right_login.png" alt="" className="absolute top-0 right-0 w-[20rem] md:w-[35rem]" />

      {/* Bottom left decoration*/}
      <img src="/bottom_left_login.png" alt="" className="absolute bottom-0 left-0 w-[15rem] md:w-[19rem]"
      />

      {/* Centered login card */}
      <div className="relative flex flex-col items-center w-full max-w-sm px-8 py-10">
        <img
          src="/lakers_homecourt.png"
          alt="Lakers Homecourt"
          className="h-16 object-contain mb-6"
        />

        <h1 className="text-morado-lakers mb-1 text-center">Hi, Lakers fan!</h1>
        <p className="text-gray-600 mb-6">So glad you're back.</p>

        {/* Capture data, first email/username */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 px-4 bg-white rounded-2xl text-zinc-500 focus:outline-2 focus:outline-morado-lakers"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 px-4 bg-white rounded-2xl text-zinc-500 focus:outline-2 focus:outline-morado-lakers"
            />
          </div>

          {/* No functionality */}
          <div className="flex justify-center items-center font-semibold"> {/*"flex justify-between items-center font-semibold">*/}
            <label className="flex items-center text-morado-lakers gap-2 ">
              <input type="checkbox" className="accent-morado-lakers" />
              Remember me
            </label>
            {/*<a href="#" className="text-morado-bajo hover:text-morado-lakers">Forgot Password?</a>*/}
          </div>

          {/* Google button */}
          <GoogleButton></GoogleButton>

          {/* Normal sign in button */}
          <Button
            text={loading ? "Signing-in" : "Sign-in"}
            type="primary"
            onClick={handleLogin}
            className="text-lg"
          />
        </div>
        {/* Error display*/}
        {errorMessage && <p className="text-center rounded-lg bg-red-100 text-red-800 outline-2 outline-red-800 mt-5 mb-1 px-2 py-3">{errorMessage}</p>}

        <p className="mt-4 mb-2 text-morado-lakers font-semibold">Don't have an account yet?</p>
        <a href="/register" className="text-morado-bajo font-semibold hover:text-morado-lakers">Sign Up Now</a>
      </div>
    </div>
  )
}

export default Login
