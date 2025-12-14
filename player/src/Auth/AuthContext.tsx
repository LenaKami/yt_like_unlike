import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';

const DEV_BYPASS = true;

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
        username: "dev-user",
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
      const interval = setInterval(() => {
        if(expiration != 0){
          console.log(Math.floor(Date.now() / 1000))
         if(( expiration < Math.floor(Date.now() / 1000))){
          console.log("Automatyczne wylogowanie")
          logOut()
         }
        }
      }, 6000);

      return () => clearInterval(interval);
    }, [expiration]);
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