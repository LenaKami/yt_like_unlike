import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { LoginFormPage } from './Pages/LoginFormPage.tsx'
import { HomePage } from './Pages/HomePage'
import { RegistrationFormPage } from './Pages/RegistrationFormPage'
import {AddPlayerPage} from "./Pages/AddPlayerYTPage";
import { UpdatePlayerPage } from "./Pages/UpdatePlayerPage";
import {FilePage} from "./Pages/FilePage";
import { PlanNaukiPage } from './Pages/StudyPlanPage.tsx';
import { FriendsPage } from './Pages/FriendsPage';
import { MusicPage } from './Pages/MusicPage';
import { StatisticsPage } from './Pages/StatisticsPage';

export const routes = {
  REGISTRATIONFORM: {
    path: "/",
    // title:
  },
  /*DATAFETCHER: {
    path: "/counter",
  },*/
  HOME: {
    path: "/home",
  },
  LOGINFORM: {
    path: "/login",
  },
  ADDPLAYER: {
    path: "/add",
  },
  UPDATEPLAYER: {
    path: "/update/:id",
  },
  FILE: {
    path: "/file",
  },
  PLAN: {
    path: "/plan",
  },
  FRIENDS: {
    path: "/friends",
  },
  MUSIC: {
    path: "/music",
  },
  STATISTICS: {
    path: "/statistics",
  },
};

export const router = createBrowserRouter([
  {
    path: "/",              // <-- Layout obejmuje całą apkę
    element: <Layout />,
    children: [
      {
        path: routes.HOME.path,        // "/" -> strona główna
        element: <HomePage />,
      },
      {
        path: routes.REGISTRATIONFORM.path,   // "/registration"
        element: <RegistrationFormPage />,
      },
      {
        path: routes.LOGINFORM.path,          // "/login" (zmień to, błagam)
        element: <LoginFormPage />,
      },
      {
        path: routes.ADDPLAYER.path,          // "/add"
        element: <AddPlayerPage />,
      },
      {
        path: routes.UPDATEPLAYER.path,       // "/update/:id"
        element: <UpdatePlayerPage />,
      },
      {
        path: routes.PLAN.path,
        element: <PlanNaukiPage />,
      },
      {
        path: routes.FRIENDS.path,
        element: <FriendsPage />,
      },
      {
        path: routes.FILE.path,
        element: <FilePage />,
      },
      {
        path: routes.STATISTICS.path,
        element: <StatisticsPage />,
      },
      {
        path: routes.MUSIC.path,
        element: <MusicPage />,
      },
    ],
  },
]);