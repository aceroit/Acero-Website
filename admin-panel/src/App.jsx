import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Permissions from "./pages/Permissions";
import RolePermissions from "./pages/RolePermissions";
import Profile from "./pages/Profile";
import Pages from "./pages/Pages";
import PageEditor from "./pages/PageEditor";
import PageTree from "./pages/PageTree";
import Sections from "./pages/Sections";
import SectionEditor from "./pages/SectionEditor";
import SectionTypes from "./pages/SectionTypes";
import SectionTypeEditor from "./pages/SectionTypeEditor";
import Resources from "./pages/Resources";
import Roles from "./pages/Roles";
import VersionHistory from "./pages/VersionHistory";
import VersionCompare from "./pages/VersionCompare";
import PendingItems from "./pages/PendingItems";
import MyDrafts from "./pages/MyDrafts";
import MySubmissions from "./pages/MySubmissions";
import Workflow from "./pages/Workflow";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <NotificationProvider>
          {/* Toast container - global, appears on all pages */}
          <ToastContainer
            position="bottom-right"
            autoClose={3000} // 3 seconds
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
            draggable
          />

          {/* App routes */}
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute resource="users" action="read">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <ProtectedRoute resource="permissions" action="read">
                <Permissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions/role/:roleName"
            element={
              <ProtectedRoute resource="permissions" action="update">
                <RolePermissions />
              </ProtectedRoute>
            }
          />
          {/* Note: roleName can be ObjectId or slug - handled in RolePermissions component */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages"
            element={
              <ProtectedRoute resource="pages" action="read">
                <Pages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/new"
            element={
              <ProtectedRoute resource="pages" action="create">
                <PageEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/tree"
            element={
              <ProtectedRoute resource="pages" action="read">
                <PageTree />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:id"
            element={
              <ProtectedRoute resource="pages" action="update">
                <PageEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:pageId/sections"
            element={
              <ProtectedRoute resource="sections" action="read">
                <Sections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:pageId/sections/new"
            element={
              <ProtectedRoute resource="sections" action="create">
                <SectionEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pages/:pageId/sections/:sectionId"
            element={
              <ProtectedRoute resource="sections" action="update">
                <SectionEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/section-types"
            element={
              <ProtectedRoute>
                <SectionTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/section-types/new"
            element={
              <ProtectedRoute>
                <SectionTypeEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/section-types/:slug"
            element={
              <ProtectedRoute>
                <SectionTypeEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/versions/:resource/:id"
            element={
              <ProtectedRoute resource="pages" action="read">
                <VersionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/versions/:resource/:id/compare"
            element={
              <ProtectedRoute resource="pages" action="read">
                <VersionCompare />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/pending"
            element={
              <ProtectedRoute resource="pages" action="read">
                <PendingItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/my-drafts"
            element={
              <ProtectedRoute resource="pages" action="read">
                <MyDrafts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/my-submissions"
            element={
              <ProtectedRoute resource="pages" action="read">
                <MySubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflow"
            element={
              <ProtectedRoute resource="workflow" action="read">
                <Workflow />
              </ProtectedRoute>
            }
          />

          {/* 404 - Redirect to dashboard if authenticated, else to login */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </NotificationProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
