import { Outlet, useLocation } from "react-router-dom"; // 1. Dodaj useLocation
import { Menu } from "./Menu";
import { routes } from "./routes"; // 2. Importuj routes, żeby sprawdzać ścieżki

export const Layout = () => {
  const location = useLocation(); // Pobieramy aktualny obiekt lokalizacji

  // 3. Lista ścieżek, na których NIE chcemy menu
  // (bazując na Twoim pliku routes.js: "/" to rejestracja, "/registration" to logowanie)
  const hideMenuPaths = [
    routes.REGISTRATIONFORM.path, 
    routes.LOGINFORM.path
  ];

  // Sprawdzamy, czy aktualny pathname znajduje się na liście ukrywania
  const showMenu = !hideMenuPaths.includes(location.pathname);

  return (
    <div className="flex items-center justify-center h-[85vh]">
      <div className="flex w-[1000px] h-[600px] bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
        
        {/* 4. Renderuj Menu tylko jeśli showMenu jest true */}
        {/*showMenu && <Menu />*/}
        <Menu />
        {/* Jeśli menu znika, main zajmie 100% szerokości dzięki flex-1 */}
        <main className="flex-1 login-color p-6 overflow-y-auto relative flex flex-col">
          <Outlet />
        </main>

      </div>
    </div>
  );
};