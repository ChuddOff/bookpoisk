import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { SWRProvider } from "@/app/providers";
import { AppToaster } from "@/shared/ui";
import { router } from "./app/router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SWRProvider>
      <RouterProvider router={router} />
      <AppToaster />
    </SWRProvider>
  </React.StrictMode>
);
