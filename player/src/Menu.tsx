// Menu.js
import { useState, useEffect } from 'react';
import { WaNavLink } from './onkrzyczy';
import { routes } from "./routes";
import { UserMenu } from "./userdb/UserMenu";
import { useAuthContext } from "./Auth/AuthContext";

export const Menu = () => {
  const { isLoggedIn, username, image: authImage } = useAuthContext();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch user image from database on component mount
  useEffect(() => {
    if (isLoggedIn && username) {
      fetchUserImage();
    }
  }, [isLoggedIn, username]);

  const fetchUserImage = async () => {
    try {
      const res = await fetch(`http://localhost:5000/user/${username}/image`);
      if (res.ok) {
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);
        setUserImage(imageUrl);
      } else {
        // If no custom image, use default or auth image
        setUserImage(null);
      }
    } catch (e) {
      console.error('Failed to fetch user image', e);
      setUserImage(null);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !username) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('username', username);

    setIsUploadingImage(true);
    try {
      const res = await fetch(`http://localhost:5000/user/${username}/image`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        // Refresh the image
        await fetchUserImage();
        // Show success message
        alert('Zdjęcie profilowe zostało zaktualizowane!');
      } else {
        alert('Błąd podczas aktualizacji zdjęcia');
      }
    } catch (e) {
      console.error('Failed to upload user image', e);
      alert('Błąd podczas przesyłania zdjęcia');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <aside className="w-60 p-6 flex flex-col flex-shrink-0 left-panel">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 relative group">
  {/* User Image */}
  <label
    className="w-16 h-16 rounded-full bg-gray-600 mb-2 relative overflow-hidden cursor-pointer flex items-center justify-center group hover:opacity-80 transition"
  >
    {userImage ? (
      <img
        src={userImage}
        alt="Avatar"
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="text-3xl">👤</div>
    )}
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-black text-xs font-medium text-center p-1">
      {isUploadingImage ? 'Przesyłanie...' : 'Zmień zdjęcie'}
    </div>
    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      disabled={isUploadingImage}
      className="hidden"
    />
  </label>

  {username && <div className="font-semibold text-white">{username}</div>}
</div>


      {/* Nawigacja */}
      <nav className="flex flex-col space-y-3 flex-grow">
        <div className='login-box-size'><WaNavLink to={routes.HOME.path}>Start</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.FILE.path}>Materiały</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.PLAN.path}>Plan nauki</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.MUSIC.path}>Muzyka</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.FRIENDS.path}>Znajomi</WaNavLink></div>
        <div className='login-box-size'><WaNavLink to={routes.STATISTICS.path}>Statystyki</WaNavLink></div>
        {!isLoggedIn && (
          <>
            <div className='login-box-size'><WaNavLink to={routes.REGISTRATIONFORM.path}>Rejestracja</WaNavLink></div>
            <div className='login-box-size'><WaNavLink to={routes.LOGINFORM.path}>Logowanie</WaNavLink></div>
          </>
        )}
        {/* Menu użytkownika jeśli zalogowany */}
        {isLoggedIn && <UserMenu />}
      </nav>
    </aside>
  );
};
