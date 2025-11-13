import {WaNavLink} from './onkrzyczy'
import { routes } from "./routes";
import { UserMenu } from "./userdb/UserMenu";
import { useAuthContext } from "./Auth/AuthContext";

  export const Menu = () => {
    const { isLoggedIn} = useAuthContext();
    return (
      <div>
        <nav className="flex justify-center">
          <div className='w-full'></div>
          <ul className='flex justify-center mt-4 font-medium flex-row space-x-8 items-center'>
              <li className="mr-2">
              <WaNavLink to={routes.HOME.path}>Home</WaNavLink>
            </li>
            <li className="mr-2">
              <WaNavLink to={routes.FILE.path}>Materiały</WaNavLink>
            </li>
        {!isLoggedIn ? (<>
            <li className="mr-2">
              <WaNavLink to={routes.REGISTRATIONFORM.path}>Registration</WaNavLink>
            </li>
            <li className="mr-2">
              <WaNavLink to={routes.LOGINFORM.path}>Login</WaNavLink>
            </li>
        </>):(<></>)}
        </ul>
        <div className='w-full mt-4 flex justify-end'>
        {!isLoggedIn ? (<>
        </>):(<><UserMenu/></>)}
        </div>
        </nav>
      </div>
    );
  };
