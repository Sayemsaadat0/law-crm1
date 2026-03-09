import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";
import Courts from "@/pages/Courts";
import CaseEdit from "@/pages/CaseEdit";
import CaseCreateContainer from "@/components/dashboard/cases/create/CaseCreateContainer";
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const Home = lazy(() => import("../pages/Home"));
const Cases = lazy(() => import("../pages/Cases"));
const CaseDetails = lazy(() => import("../pages/CaseDetails"));
const Members = lazy(() => import("../pages/Members"));
const Profile = lazy(() => import("../pages/Profile"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard/home" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // redirect /dashboard → /dashboard/home
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: "home",
        element: (
          <Suspense fallback={<p>Loading...</p>}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "cases",
        element: (
          <Suspense fallback={<p>Loading...</p>}>
            <Cases />
          </Suspense>
        ),
      },
      {
        path: "cases/:id",
        element: (
          <Suspense fallback={<p>Loading...</p>}>
            <CaseDetails />
          </Suspense>
        ),
      },
      {
        path: "cases/create",
        element: <CaseCreateContainer />,
      },
      {
        path: "cases/edit/:id",
        element: (
          <RoleBasedRoute allowedRoles={['admin', 'owner']}>
            <Suspense fallback={<p>Loading...</p>}>
              <CaseEdit />
            </Suspense>
          </RoleBasedRoute>
        ),
      },
      {
        path: "members",
        element: (
          <RoleBasedRoute allowedRoles={['admin']}>
            <Suspense fallback={<p>Loading...</p>}>
              <Members />
            </Suspense>
          </RoleBasedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<p>Loading...</p>}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: "courts",
        element: (
          <Suspense fallback={<p>Loading...</p>}>
            <Courts />
          </Suspense>
        ),
      },
    ],
  },
]);

export default router;
