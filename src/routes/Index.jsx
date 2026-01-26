import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./PublicRoutes";
import { authRoutes } from "./AuthRoutes";

const allRoutes = [...publicRoutes, ...authRoutes];

export const router = createBrowserRouter(allRoutes);