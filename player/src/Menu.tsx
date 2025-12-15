// Menu.js
import { useState } from 'react';
import { WaNavLink } from './onkrzyczy';
import { routes } from "./routes";
import { UserMenu } from "./userdb/UserMenu";
import { useAuthContext } from "./Auth/AuthContext";

export const Menu = () => {
  const { isLoggedIn } = useAuthContext();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      // Tutaj możesz dodać dalsze przetwarzanie, np. upload
    }
  };

  return (
    <aside className="w-60 p-6 flex flex-col flex-shrink-0 left-panel">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 relative group">
  {/* Label jako przycisk */}
  <label
    htmlFor="avatar-file"
    className="w-16 h-16 rounded-full bg-gray-600 mb-2 relative overflow-hidden cursor-pointer"
  >
    {selectedImage ? (
      <img
        src={URL.createObjectURL(selectedImage)}
        alt="Avatar"
        className="w-full h-full object-cover"
      />
    ) : null}

    {/* Overlay po najechaniu */}
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-gray-100 text-sm font-medium">
      Ustaw zdjęcie
    </div>
  </label>

  {/* Ukryty input pliku */}
  <input
    id="avatar-file"
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
  />

  <div className="font-semibold text-white">Antek Wróbel</div>
</div>


      {/* Nawigacja */}
      <nav className="flex flex-col space-y-3 flex-grow">
        <div className='login-box-size'><WaNavLink to={routes.HOME.path}>Start</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.FILE.path}>Materiały</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.PLAN.path}>Plan nauki</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.STATISTICS.path}>Statystyki</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.MUSIC.path}>Muzyka</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.FRIENDS.path}>Znajomi</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.STATISTICS.path}>Statystyki</WaNavLink></div>
        {!isLoggedIn && (
          <>
            <div className='login-box-size'><WaNavLink to={routes.REGISTRATIONFORM.path}>Rejestracja</WaNavLink></div>
            <div className='login-box-size'><WaNavLink to={routes.LOGINFORM.path}>Logowanie</WaNavLink></div>
          </>
        )}
      </nav>

      {/* Menu użytkownika jeśli zalogowany */}
      {isLoggedIn && <UserMenu />}
    </aside>
  );
};
