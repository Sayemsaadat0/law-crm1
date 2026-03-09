import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes/Router";
import { Toaster } from "sonner";
import AuthInitializer from "./components/auth/AuthInitializer";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthInitializer>
      <Toaster />
      <RouterProvider router={router} />
    </AuthInitializer>
  </React.StrictMode>
);
