import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { SWRProvider } from "@/app/providers";
import { AppToaster } from "@/shared/ui";
import { AppRouter } from "./app/router";
import { AuthGateProvider } from "./app/providers/AuthGateProvider";
import { initTelegramLayout } from "./shared/lib/tg";

initTelegramLayout();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SWRProvider>
      <AuthGateProvider>
        <RouterProvider router={AppRouter} />
        <AppToaster />
      </AuthGateProvider>
    </SWRProvider>
  </React.StrictMode>
);
