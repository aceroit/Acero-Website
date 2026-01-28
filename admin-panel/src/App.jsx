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
import Projects from "./pages/Projects";
import ProjectEditor from "./pages/ProjectEditor";
import Branches from "./pages/Branches";
import BranchEditor from "./pages/BranchEditor";
import Customers from "./pages/Customers";
import CustomerEditor from "./pages/CustomerEditor";
import Certifications from "./pages/Certifications";
import CertificationEditor from "./pages/CertificationEditor";
import CompanyUpdates from "./pages/CompanyUpdates";
import CompanyUpdateEditor from "./pages/CompanyUpdateEditor";
import CompanyUpdateCategories from "./pages/CompanyUpdateCategories";
import CompanyUpdateCategoryEditor from "./pages/CompanyUpdateCategoryEditor";
import Brochures from "./pages/Brochures";
import BrochureEditor from "./pages/BrochureEditor";
import BuildingTypes from "./pages/BuildingTypes";
import BuildingTypeEditor from "./pages/BuildingTypeEditor";
import Industries from "./pages/Industries";
import IndustryEditor from "./pages/IndustryEditor";
import Countries from "./pages/Countries";
import CountryEditor from "./pages/CountryEditor";
import Regions from "./pages/Regions";
import RegionEditor from "./pages/RegionEditor";
import Areas from "./pages/Areas";
import AreaEditor from "./pages/AreaEditor";
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
import HeaderConfigurations from "./pages/HeaderConfigurations";
import HeaderConfigurationEditor from "./pages/HeaderConfigurationEditor";
import FooterConfigurations from "./pages/FooterConfigurations";
import FooterConfigurationEditor from "./pages/FooterConfigurationEditor";
import WebsiteAppearances from "./pages/WebsiteAppearances";
import WebsiteAppearanceEditor from "./pages/WebsiteAppearanceEditor";
import SMTPSettings from "./pages/SMTPSettings";
import SMTPSettingsEditor from "./pages/SMTPSettingsEditor";
import GoogleReCaptchas from "./pages/GoogleReCaptchas";
import GoogleReCaptchaEditor from "./pages/GoogleReCaptchaEditor";
import GoogleMaps from "./pages/GoogleMaps";
import GoogleMapsEditor from "./pages/GoogleMapsEditor";
import Vacancies from "./pages/Vacancies";
import VacancyEditor from "./pages/VacancyEditor";
import Enquiries from "./pages/Enquiries";
import EnquiryEditor from "./pages/EnquiryEditor";
import Applications from "./pages/Applications";
import ApplicationEditor from "./pages/ApplicationEditor";
import FormConfigurationEditor from "./pages/FormConfigurationEditor";
import ParentRouteRedirect from "./components/common/ParentRouteRedirect";
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
            path="/projects"
            element={
              <ProtectedRoute resource="projects" action="read">
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute resource="projects" action="create">
                <ProjectEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute resource="projects" action="update">
                <ProjectEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute resource="branches" action="read">
                <Branches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches/new"
            element={
              <ProtectedRoute resource="branches" action="create">
                <BranchEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches/:id"
            element={
              <ProtectedRoute resource="branches" action="update">
                <BranchEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute resource="customers" action="read">
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute resource="customers" action="create">
                <CustomerEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute resource="customers" action="update">
                <CustomerEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications"
            element={
              <ProtectedRoute resource="certifications" action="read">
                <Certifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications/new"
            element={
              <ProtectedRoute resource="certifications" action="create">
                <CertificationEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications/:id"
            element={
              <ProtectedRoute resource="certifications" action="update">
                <CertificationEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-updates"
            element={
              <ProtectedRoute resource="company-updates" action="read">
                <CompanyUpdates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-updates/new"
            element={
              <ProtectedRoute resource="company-updates" action="create">
                <CompanyUpdateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-updates/:id"
            element={
              <ProtectedRoute resource="company-updates" action="update">
                <CompanyUpdateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-update-categories"
            element={
              <ProtectedRoute resource="company-update-categories" action="read">
                <CompanyUpdateCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-update-categories/new"
            element={
              <ProtectedRoute resource="company-update-categories" action="create">
                <CompanyUpdateCategoryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-update-categories/:id"
            element={
              <ProtectedRoute resource="company-update-categories" action="update">
                <CompanyUpdateCategoryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brochures"
            element={
              <ProtectedRoute resource="brochures" action="read">
                <Brochures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brochures/new"
            element={
              <ProtectedRoute resource="brochures" action="create">
                <BrochureEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brochures/:id"
            element={
              <ProtectedRoute resource="brochures" action="update">
                <BrochureEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/building-types"
            element={
              <ProtectedRoute resource="building-types" action="read">
                <BuildingTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/building-types/new"
            element={
              <ProtectedRoute resource="building-types" action="create">
                <BuildingTypeEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/building-types/:id"
            element={
              <ProtectedRoute resource="building-types" action="update">
                <BuildingTypeEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/industries"
            element={
              <ProtectedRoute resource="industries" action="read">
                <Industries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/industries/new"
            element={
              <ProtectedRoute resource="industries" action="create">
                <IndustryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/industries/:id"
            element={
              <ProtectedRoute resource="industries" action="update">
                <IndustryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/countries"
            element={
              <ProtectedRoute resource="countries" action="read">
                <Countries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/countries/new"
            element={
              <ProtectedRoute resource="countries" action="create">
                <CountryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/countries/:id"
            element={
              <ProtectedRoute resource="countries" action="update">
                <CountryEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regions"
            element={
              <ProtectedRoute resource="regions" action="read">
                <Regions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regions/new"
            element={
              <ProtectedRoute resource="regions" action="create">
                <RegionEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regions/:id"
            element={
              <ProtectedRoute resource="regions" action="update">
                <RegionEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/areas"
            element={
              <ProtectedRoute resource="areas" action="read">
                <Areas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/areas/new"
            element={
              <ProtectedRoute resource="areas" action="create">
                <AreaEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/areas/:id"
            element={
              <ProtectedRoute resource="areas" action="update">
                <AreaEditor />
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

          {/* Website Configurations Routes */}
          {/* Header Configuration */}
          <Route
            path="/website-configurations/header"
            element={
              <ProtectedRoute resource="header-configurations" action="read">
                <HeaderConfigurations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/header/new"
            element={
              <ProtectedRoute resource="header-configurations" action="create">
                <HeaderConfigurationEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/header/:id"
            element={
              <ProtectedRoute resource="header-configurations" action="update">
                <HeaderConfigurationEditor />
              </ProtectedRoute>
            }
          />
          {/* Footer Configuration */}
          <Route
            path="/website-configurations/footer"
            element={
              <ProtectedRoute resource="footer-configurations" action="read">
                <FooterConfigurations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/footer/new"
            element={
              <ProtectedRoute resource="footer-configurations" action="create">
                <FooterConfigurationEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/footer/:id"
            element={
              <ProtectedRoute resource="footer-configurations" action="update">
                <FooterConfigurationEditor />
              </ProtectedRoute>
            }
          />
          {/* Website Appearance */}
          <Route
            path="/website-configurations/appearance"
            element={
              <ProtectedRoute resource="website-appearance" action="read">
                <WebsiteAppearances />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/appearance/new"
            element={
              <ProtectedRoute resource="website-appearance" action="create">
                <WebsiteAppearanceEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/appearance/:id"
            element={
              <ProtectedRoute resource="website-appearance" action="update">
                <WebsiteAppearanceEditor />
              </ProtectedRoute>
            }
          />
          {/* SMTP Settings */}
          <Route
            path="/website-configurations/smtp"
            element={
              <ProtectedRoute resource="smtp-settings" action="read">
                <SMTPSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/smtp/new"
            element={
              <ProtectedRoute resource="smtp-settings" action="create">
                <SMTPSettingsEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/smtp/:id"
            element={
              <ProtectedRoute resource="smtp-settings" action="update">
                <SMTPSettingsEditor />
              </ProtectedRoute>
            }
          />
          {/* Google ReCaptcha */}
          <Route
            path="/website-configurations/recaptcha"
            element={
              <ProtectedRoute resource="google-recaptcha" action="read">
                <GoogleReCaptchas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/recaptcha/new"
            element={
              <ProtectedRoute resource="google-recaptcha" action="create">
                <GoogleReCaptchaEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/recaptcha/:id"
            element={
              <ProtectedRoute resource="google-recaptcha" action="update">
                <GoogleReCaptchaEditor />
              </ProtectedRoute>
            }
          />
          {/* Google Maps */}
          <Route
            path="/website-configurations/maps"
            element={
              <ProtectedRoute resource="google-maps" action="read">
                <GoogleMaps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/maps/new"
            element={
              <ProtectedRoute resource="google-maps" action="create">
                <GoogleMapsEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-configurations/maps/:id"
            element={
              <ProtectedRoute resource="google-maps" action="update">
                <GoogleMapsEditor />
              </ProtectedRoute>
            }
          />

          {/* Enquiries and Applications Routes */}
          {/* Vacancies */}
          <Route
            path="/enquiries-applications/vacancies"
            element={
              <ProtectedRoute resource="vacancies" action="read">
                <Vacancies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries-applications/vacancies/new"
            element={
              <ProtectedRoute resource="vacancies" action="create">
                <VacancyEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries-applications/vacancies/:id"
            element={
              <ProtectedRoute resource="vacancies" action="update">
                <VacancyEditor />
              </ProtectedRoute>
            }
          />
          {/* Enquiries */}
          <Route
            path="/enquiries-applications/enquiries"
            element={
              <ProtectedRoute resource="enquiries" action="read">
                <Enquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries-applications/enquiries/:id"
            element={
              <ProtectedRoute resource="enquiries" action="update">
                <EnquiryEditor />
              </ProtectedRoute>
            }
          />
          {/* Applications */}
          <Route
            path="/enquiries-applications/applications"
            element={
              <ProtectedRoute resource="applications" action="read">
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries-applications/applications/:id"
            element={
              <ProtectedRoute resource="applications" action="update">
                <ApplicationEditor />
              </ProtectedRoute>
            }
          />
          {/* Form Configuration */}
          <Route
            path="/enquiries-applications/form-configuration"
            element={
              <ProtectedRoute resource="form-configurations" action="update">
                <FormConfigurationEditor />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes - Redirect to first child if no dedicated page */}
          {/* Enquiries and Applications - Parent route */}
          <Route
            path="/enquiries-applications"
            element={
              <ProtectedRoute>
                <ParentRouteRedirect />
              </ProtectedRoute>
            }
          />
          {/* Website Configurations - Parent route */}
          <Route
            path="/website-configurations"
            element={
              <ProtectedRoute>
                <ParentRouteRedirect />
              </ProtectedRoute>
            }
          />
          {/* Company Related Information - Parent route */}
          <Route
            path="/company-related-information"
            element={
              <ProtectedRoute>
                <ParentRouteRedirect />
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
