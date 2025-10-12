import { createBrowserRouter } from "react-router-dom";

import { BookPage, CatalogPage, HomePage, TmaHomePage } from "@/pages";
import { TmaLayout, WebLayout } from "./layouts";

export const router = createBrowserRouter(
  [
    {
      element: <WebLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "catalog", element: <CatalogPage /> },
        { path: "book/:id", element: <BookPage /> },
      ],
    },
    {
      path: "/tma",
      element: <TmaLayout />,
      children: [
        { index: true, element: <TmaHomePage /> },
        { path: "catalog", element: <CatalogPage /> },
        { path: "book/:id", element: <BookPage /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
