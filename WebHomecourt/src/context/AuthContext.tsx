import { createContext, useEffect, useState, useContext } from "react";
import type { ReactNode} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// Define el tipo de datos que contiene el contexto de autenticación
interface AuthContextType {
  session: Session | null; // Sesión actualizada del usuario autenticado
  user: User | null; // Información del usuario autenticado
  userType: number | null; 
  nickname: string | null;
  photoUrl: string | null;
  loading: boolean; 
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>; // Función para iniciar sesión
  signOut: () => Promise<void>; // Función para cerrar sesión
}

// contexto de autenticacion
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el componente que requiere sesion activa
type RequireSessionProps = {
  children: ReactNode; // Mostrar si hay sesion activa
  fallback?: ReactNode; // No sesion activa
}

// Proveedor principal de autenticacion
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<number | null>(null); // Empieza en null hasta obtener el rol del usuario
  const [nickname, setNickname] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Empieza en true hasta que supabase confirme si hay sesión activa o no

  const fetchUserData = (userId: string) => {
    supabase
      .from('user_laker')
      .select("user_type, nickname, photo_url")
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setUserType(data?.user_type ?? null);
        setNickname(data?.nickname ?? null);
        setPhotoUrl(data?.photo_url ?? null);
      });
  };
  // Obtiene sesion actual y escucha cambios de autenticacion
  useEffect(() => {
    // Sesion actual de Supabase
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false); 

      if (data.session?.user) {
        fetchUserData(data.session.user.id);
      }
    });

  const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserType(null);
        setNickname(null);
        setPhotoUrl(null);
      }
    });

    // Desuscribete para evitar memory leaks
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Iniciar sesion con correo y contraseña
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // Cerrar sesion
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, userType, nickname, photoUrl, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto de auth desde cualquier componente
// Lanza error si se usa fuera del AuthContextProvider
export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("UserAuth must be used within an AuthContextProvider");
  return context;
};

export const useAuth = UserAuth;

// Hook que requiere una sesion activa obligatoriamente
// Lanza error si el usuario no esta autenticado
export const useRequiredSession = () => {
  const { session } = useAuth();
  if (!session) throw new Error("This component requires an active session");
  return session;
};

// Renderiza contenido condicionalmente según si hay sesión activa
// Muestra fallback si no hay sesion, o children si la hay
export const RequireSession = ({ children, fallback = null }: RequireSessionProps) => {
  const { session } = useAuth();

  // Si no hay sesion activa, renderiza el fallback
  if (!session) return <>{fallback}</>;

  // Si hay sesion, renderiza el contenido principal
  return <>{children}</>;
};