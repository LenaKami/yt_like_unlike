const API_URL = "http://localhost:5000/file";

export interface FileFromBackend {
  id: number;
  username: string;
  filename: string;
  category: string;
  filepath: string;
  created_at: string;
}

export interface FolderFromBackend {
  id: number;
  username: string;
  foldername: string;
  created_at: string;
}

export interface User {
  login: string;
  email: string;
  profile_picture: string;
}

export interface Friend {
  login: string;
  email?: string;
  profile_picture?: string;
}

export const fileApi = {
  // Pobierz pliki użytkownika
  getUserFiles: async (username: string): Promise<FileFromBackend[]> => {
    try {
      const response = await fetch(`${API_URL}/user/${username}`);
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user files:", error);
      return [];
    }
  },

  // Pobierz foldery użytkownika
  getUserFolders: async (username: string): Promise<FolderFromBackend[]> => {
    try {
      const response = await fetch(`${API_URL}/folders/${username}`);
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user folders:", error);
      return [];
    }
  },

  // Dodaj folder
  addFolder: async (
    username: string,
    foldername: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/folder/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, foldername }),
      });

      const data = await response.json();
      
      if (data.status === 200) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Błąd podczas dodawania folderu" };
      }
    } catch (error) {
      console.error("Error adding folder:", error);
      return { success: false, message: "Błąd podczas dodawania folderu" };
    }
  },

  // Upload pliku
  uploadFile: async (
    username: string,
    filename: string,
    category: string,
    file: File
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("filename", filename);
      formData.append("category", category);
      formData.append("file", file);

      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.status === 200) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Błąd podczas uploadowania pliku" };
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, message: "Błąd podczas uploadowania pliku" };
    }
  },

  // Pobierz plik do dysku
  downloadFile: async (id: number, filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/download/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error("Error downloading file:", error);
      return false;
    }
  },

  // Usuń plik
  deleteFile: async (id: number, username: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/delete/${id}/${username}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.status === 200) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Błąd podczas usuwania pliku" };
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, message: "Błąd podczas usuwania pliku" };
    }
  },

  // Pobierz wszystkich użytkowników (do udostępniania)
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch("http://localhost:5000/user/all");
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  // Udostępnij plik wybranym użytkownikom
  shareFile: async (
    fileId: number,
    usernames: string[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: fileId, usernames }),
      });

      const data = await response.json();
      
      if (data.status === 200) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Błąd podczas udostępniania pliku" };
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      return { success: false, message: "Błąd podczas udostępniania pliku" };
    }
  },

  // Pobierz pliki udostępnione użytkownikowi
  getSharedFiles: async (username: string): Promise<FileFromBackend[]> => {
    try {
      const response = await fetch(`${API_URL}/shared-with/${username}`);
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching shared files:", error);
      return [];
    }
  },

  // Pobierz znajomych użytkownika
  getFriends: async (username: string): Promise<Friend[]> => {
    try {
      const response = await fetch(`http://localhost:5000/friend/${username}`);
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        // Backend zwraca tablicę stringów (nazw użytkowników), konwertujemy na obiekty Friend
        return data.data.map((friendName: string) => ({ login: friendName }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching friends:", error);
      return [];
    }
  },

  // Pobierz listę użytkowników którym plik został już udostępniony
  getFileShares: async (fileId: number): Promise<string[]> => {
    try {
      const response = await fetch(`${API_URL}/shares/${fileId}`);
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        return data.data.map((item: any) => item.shared_with);
      }
      return [];
    } catch (error) {
      console.error("Error fetching file shares:", error);
      return [];
    }
  },
};
