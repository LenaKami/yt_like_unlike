import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { LoginFormPage } from './Pages/LoginFormPage.tsx'
import { HomePage } from './Pages/HomePage'
import { RegistrationFormPage } from './Pages/RegistrationFormPage'
import {AddPlayerPage} from "./Pages/AddPlayerYTPage";
import { UpdatePlayerPage } from "./Pages/UpdatePlayerPage";

export const routes = {
  HOME: {
    path: "/",
    // title:
  },
  /*DATAFETCHER: {
    path: "/counter",
  },*/
  REGISTRATIONFORM: {
    path: "/generator",
  },
  LOGINFORM: {
    path: "/registration",
  },
  ADDPLAYER: {
    path: "/add",
  },
  UPDATEPLAYER: {
    path: "/update/:id",
  },
};

export const router = createBrowserRouter([
  {
    path: routes.HOME.path,
    element: <Layout />,
    children: [
      {
        path: routes.HOME.path,
        element: <HomePage />,
      },
      /*{
        path: routes.DATAFETCHER.path,
        element: <DataFetcherPage />,
      },*/
      {
        path: routes.REGISTRATIONFORM.path,
        element: <RegistrationFormPage />,
      },
      {
        path: routes.LOGINFORM.path,
        element: <LoginFormPage />,
      },
      {
        path: routes.ADDPLAYER.path,
        element: < AddPlayerPage/>,
      },
      {
        path: routes.UPDATEPLAYER.path,
        element: < UpdatePlayerPage/>,
      },
    ],
  },
]);