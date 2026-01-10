import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "./Menu";
import { routes } from "./routes";
import { PlayerBar } from "./Music/PlayerBar";

export const Layout = () => {
  const location = useLocation();

  const hideMenuPaths = [
    routes.REGISTRATIONFORM.path, 
    routes.LOGINFORM.path
  ];

  const showMenu = !hideMenuPaths.includes(location.pathname);

  return (
    <>
      {/* ZMIANA 1: Zamiast h-[85vh] dajemy min-h-[85vh] i padding (py-12), 
          żeby w razie dużej treści cała strona się scrollowała, a nie ucięła. */}
      <div className="flex items-center justify-center min-h-[85vh] py-12 px-4">
        
        {/* ZMIANA 2: Responsywna szerokość - mobile: pełna szerokość z paddingiem, desktop: max 1000px */}
        <div className="flex w-full max-w-[1000px] min-h-[400px] bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
          
          {showMenu && <Menu />}

          {/* ZMIANA 3: Usuwamy 'overflow-y-auto'. 
              Teraz main nie będzie miał paska, tylko rozepcha rodzica (div wyżej). */}
          <main className="flex-1 login-color p-6 relative flex flex-col">
            <Outlet />
          </main>

        </div>
      </div>
      
      {/* PlayerBar widoczny globalnie */}
      <PlayerBar />
    </>
  );
};