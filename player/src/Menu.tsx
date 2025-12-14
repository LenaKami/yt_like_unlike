// Menu.js
import { WaNavLink } from './onkrzyczy';
import { routes } from "./routes";
import { UserMenu } from "./userdb/UserMenu";
import { useAuthContext } from "./Auth/AuthContext";

export const Menu = () => {
  const { isLoggedIn } = useAuthContext();

  // Zwracamy TYLKO <aside>, bez zewnętrznych kontenerów
  return (
    <aside className="w-60 p-6 flex flex-col flex-shrink-0 left-panel">
      <div className="flex flex-col items-center mb-6">
        {/* Avatar użytkownika */}
        <div className="w-16 h-16 rounded-full bg-gray-600 mb-2"></div>
        <div className="font-semibold text-white">Antek Wróbel</div>
      </div>

      {/* Nawigacja */}
      <nav className="flex flex-col space-y-3 flex-grow">
        <WaNavLink to={routes.HOME.path}>Start</WaNavLink>
        <WaNavLink to={routes.FILE.path}>Materiały</WaNavLink>
        <WaNavLink to={routes.PLAN.path}>Plan nauki</WaNavLink>
        <WaNavLink to={routes.MUSIC.path}>Muzyka</WaNavLink>
        <WaNavLink to={routes.FRIENDS.path}>Znajomi</WaNavLink>
        {!isLoggedIn && (
          <>
            <WaNavLink to={routes.REGISTRATIONFORM.path}>Rejestracja</WaNavLink>
            <WaNavLink to={routes.LOGINFORM.path}>Logowanie</WaNavLink>
          </>
        )}
      </nav>

      {/* Menu użytkownika jeśli zalogowany */}
      {isLoggedIn && <UserMenu />}
    </aside>
  );
};