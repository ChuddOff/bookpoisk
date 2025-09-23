import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { TmaHomePage } from "@/pages/tma";
import { TmaLayout, WebLayout } from "./layouts";

export const router = createBrowserRouter([
  {
    element: <WebLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: "/tma",
    element: <TmaLayout />,
    children: [{ index: true, element: <TmaHomePage /> }],
  },
]);
