import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js'; // Para get rid of any warning

function UserSession() {
    const [user, setUser] = useState<User | null >(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            console.log("Session:", data.session);
            setUser(data.session?.user ?? null); // Sets user data or null if there is no session
        });
    }, []);

    // To let us go to the home page
    const handleRedirect = () => {
        // Navigate to a specific path
        navigate('/');
    }

    return (
        <div>
            {user ? <p>User with email: {user.email}</p> : <p>No user session :(</p>}
            <button onClick={handleRedirect} className="bg-morado-lakers rounded text-white mt-2 px-3 py-3">Go to home</button>
        </div>
    )
}

export default UserSession