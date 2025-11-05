// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";

import { BookPage, CatalogPage, HomePage, TmaHomePage } from "@/pages";
import { TmaLayout, WebLayout } from "./layouts";
import { AuthDonePage } from "@/pages/auth/ui/AuthDonePage";
import { ProfilePage } from "@/pages/profile/ui/ProfilePage";

export const AppRouter = createBrowserRouter(
  [
    // ⬇️ Специальная страница завершения логина — без лэйаута
    { path: "/auth/done", element: <AuthDonePage /> },

    {
      element: <WebLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "catalog", element: <CatalogPage /> },
        { path: "book/:id", element: <BookPage /> },
        { path: "profile", element: <ProfilePage /> },
      ],
    },
    {
      path: "/tma",
      element: <TmaLayout />,
      children: [
        { index: true, element: <TmaHomePage /> },
        { path: "catalog", element: <CatalogPage /> }, // => /tma/catalog
        { path: "book/:id", element: <BookPage /> }, // => /tma/book/:id
        { path: "profile", element: <ProfilePage /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL, // ок для Vite/Vercel
  }
);
