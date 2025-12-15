//import { routes } from "../../routes";
//import {WaNavLink} from '../../onkrzyczy'
import { useAuthContext } from "../../Auth/AuthContext";
import { WaNavLink } from '../../onkrzyczy';
import { routes } from "../../routes";

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
                <div className="flex flex-col space-y-3 flex-grow items-center">
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
                    <div className='login-box-size'><WaNavLink to={routes.REGISTRATIONFORM.path}>Wyloguj</WaNavLink></div>
                </div>
            ) : (<>
            </>
            )}
    </>
  );
}