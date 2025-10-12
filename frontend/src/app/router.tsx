import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { TmaHomePage } from "@/pages/tma";
import { TmaLayout, WebLayout } from "./layouts";
import { CatalogPage } from "@/pages/catalog";
import { BookPage } from "@/pages/book/ui/BookPage";

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
