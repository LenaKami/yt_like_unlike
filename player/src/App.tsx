//import React, { useState } from 'react';
//import ReactPlayer from 'react-player';
import './App.css';
//import { AllPlayerYT } from './player/AllPlayerYT';
//import { AddPlayerYT } from './player/AddPlayer';
import { RouterProvider } from "react-router-dom";
import { router } from "./routes"
import { ThemeContextProvider } from './Themee/ThemeContext';
import { ThemeSwitcher } from './Themee/ThemeSwitcher';
import { AuthContextProvider } from "./Auth/AuthContext";
import { MusicContextProvider } from "./Music/MusicContext";


function App() {
  return(
    <>
     <div className="App">
      <main>
      <AuthContextProvider>
        <ThemeContextProvider>
          <MusicContextProvider>
            <ThemeSwitcher/>
            <RouterProvider router={router} />
          </MusicContextProvider>
        </ThemeContextProvider>
        </AuthContextProvider>
      </main>
    </div>
    </>
)
}

export default App;
