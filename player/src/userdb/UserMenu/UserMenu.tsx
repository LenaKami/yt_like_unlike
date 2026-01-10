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
                <div className='login-box-size'><WaNavLink to={routes.REGISTRATIONFORM.path}>Wyloguj</WaNavLink></div>
            ) : (<>
            </>
            )}
    </>
  );
}