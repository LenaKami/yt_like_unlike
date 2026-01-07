import { createContext, useContext, useEffect, useState } from "react";
import jwtDecode from 'jwt-decode';

const DEV_BYPASS = false;

type AuthContextType = {
  isLoggedIn: boolean;
  username: string;
  image: string;
  logIn: () => void;
  logOut: () => void;
  isAdmin: boolean
};

type JwtPayLoad = {
  login:string
  exp: number
  role: boolean
  image: string
}
export const AuthContext = createContext<AuthContextType | null>(null);
AuthContext.displayName = "AuthContext";

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      "Komponent nie został umieszczony w AuthContext"
    );
  }
  return context;
};


const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setuserName ] = useState ("");
    const [image, setImage] = useState("");
    const [expiration, setExpiration] = useState(0);

    if (DEV_BYPASS) {
      return {
        isLoggedIn: true,
        username: "",
        image: "",
        logIn: () => {},
        logOut: () => {},
        isAdmin: true,
      };
    }

    const logIn = () => {
      const token = localStorage.getItem('jwtToken');
      if(token != null){
        setIsLoggedIn(true);
        const decodedToken = jwtDecode<JwtPayLoad>(token);
        console.log(decodedToken);
        setuserName(decodedToken.login)
        setImage(decodedToken.image);
        setExpiration(decodedToken.exp)
        if(decodedToken.role){
          setIsAdmin(true)
        }
      }
    }
    const logOut = () => {
      setIsLoggedIn(false);
      setuserName("");
      setImage("");
      setExpiration(0)
      localStorage.removeItem('jwtToken');
      window.location.href = '/';
    }
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token != null) {
          setIsLoggedIn(true);
          const decodedToken = jwtDecode<JwtPayLoad>(token);
          setuserName(decodedToken.login)
          setImage(decodedToken.image)
          setExpiration(decodedToken.exp)
          if(decodedToken.role){
            setIsAdmin(true)
          }
        }
    }, []);
    useEffect(() => {
      // Sprawdzanie ważności JWT i automatyczne wylogowanie
      const interval = setInterval(() => {
        if (expiration !== 0) {
          if (expiration < Math.floor(Date.now() / 1000)) {
            console.log("Automatyczne wylogowanie");
            logOut();
          }
        }
      }, 6000);
      return () => clearInterval(interval);
    }, [expiration]);

    useEffect(() => {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

      const pingActive = async () => {
        try {
          const token = localStorage.getItem('jwtToken');
          if (!token || !username) return;
          await fetch(`${API_BASE}/user/active`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ username }),
          });
        } catch (e) {
          // ignore network errors
        }
      };

      // initial ping when effect runs (if logged in)
      if (isLoggedIn && username) pingActive();

      // periodic ping
      const pingInterval = setInterval(() => {
        if (isLoggedIn && username) pingActive();
      }, 30000);

      // ping on visibility/focus (user returns to tab) and on navigation
      const onVisibility = () => { if (document.visibilityState === 'visible') pingActive(); };
      const onFocus = () => pingActive();

      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('focus', onFocus);

      // Detect client-side navigation (pushState/replaceState)
      const wrapHistoryMethod = (type: 'pushState' | 'replaceState') => {
        const original = (window.history as any)[type];
        (window.history as any)[type] = function (...args: any[]) {
          const result = original.apply(this, args);
          window.dispatchEvent(new Event('locationchange'));
          return result;
        };
      };
      wrapHistoryMethod('pushState');
      wrapHistoryMethod('replaceState');

      const onLocationChange = () => { if (isLoggedIn && username) pingActive(); };
      window.addEventListener('locationchange', onLocationChange);
      window.addEventListener('popstate', onLocationChange);

      return () => {
        clearInterval(pingInterval);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('locationchange', onLocationChange);
        window.removeEventListener('popstate', onLocationChange);
      };
    }, [isLoggedIn, username]);
    return { isLoggedIn, username,image, logIn, logOut,isAdmin };
};

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isLoggedIn, username, image, logIn, logOut,isAdmin } = useAuth();
  return (
    <AuthContext.Provider value={{ isLoggedIn,username, image, logIn, logOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};