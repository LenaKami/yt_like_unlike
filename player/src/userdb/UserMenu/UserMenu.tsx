//import { routes } from "../../routes";
//import {WaNavLink} from '../../onkrzyczy'
import { useAuthContext } from "../../Auth/AuthContext";

export const UserMenu = () => {
    const { isLoggedIn, username, image, logOut } = useAuthContext();
    console.log(image);
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');  // Remove the JWT token
        logOut()
    }

    return (
        <>
            {isLoggedIn ? (
                <div className="flex flex-row items-center">
                    <p className="">{username}</p>
                    {/* Wyświetlanie obrazu użytkownika */}
                    {image ? (
                        <img 
                        src={image} 
                        alt="User profile" 
                        className="w-10 h-10 rounded-full mr-3 object-cover" 
                    />
                    
                    ) : (
                        <p> </p>
                    )}
                    <button className="log-in px-3 py-1" onClick={handleLogout}>Logout</button>
                </div>
            ) : (<>
            </>
            )}
    </>
  );
}