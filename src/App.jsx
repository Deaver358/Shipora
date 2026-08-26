import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Home from "./pages/Home";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import Shipments from "./pages/Shipments";
import MyShipments from "./pages/MyShipments";
import CreateShipment from "./pages/CreateShipment";
import ShipmentDetails from "./pages/ShipmentDetails";

import Tracking from "./pages/Tracking";
import Dashboard from "./pages/Dashboard";
import DispatchAvailability from "./pages/DispatchAvailability";

import VerifyRole from "./pages/VerifyRole";
import VerifyVendor from "./pages/VerifyVendor";
import VerifyDispatch from "./pages/VerifyDispatch";
import VerifyBoth from "./pages/VerifyBoth";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help"; 
import Contact from "./pages/Contact";
import Vendor from "./pages/Vendor";
import Dispatch from "./pages/Dispatch";
import FindDispatch from "./pages/FindDispatch";
import MyDeliveries from "./pages/MyDeliveries";
import DispatchJobs from "./pages/DispatchJobs";
import DeliveryDetails from "./pages/DeliveryDetails";
import Pending from "./pages/Pending";
import Review from "./pages/Review";
import Rejected from "./pages/Rejected";
import Verified from "./pages/Verified";

import Admin from "./pages/Admin";

import "./index.css";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/pending" element={<Pending />} />
        <Route path="/review" element={<Review />} />
        <Route path="/rejected" element={<Rejected />} />
        <Route path="/verified" element={<Verified />} />

        <Route
  path="/my-deliveries"
  element={<MyDeliveries />}
/>

<Route
  path="/dispatch-jobs"
  element={<DispatchJobs />}
/>

<Route
  path="/delivery-details/:id"
  element={<DeliveryDetails />}
/>

        <Route
  path="/findDispatch"
  element={<FindDispatch />}
/>

        <Route
  path="/dispatch"
  element={<Dispatch />}
/>
        <Route
  path="/vendor"
  element={<Vendor />}
/>

        <Route path="/help" element={<Help />} /> 
        <Route path="/contact" element={<Contact />} />
        <Route path="/changePassword" element={<ChangePassword />} />


        <Route
  path="/notifications"
  element={<Notifications />}
/>

<Route
  path="/profile"
  element={<Profile />}
/>

<Route
  path="/settings"
  element={<Settings />}
/>

        {/* ================= PUBLIC ================= */}

        <Route
          path="/"
          element={<Index />}
        />

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/tracking"
          element={<Tracking />}
        />


        {/* ================= AUTHENTICATION ================= */}

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/email-verification"
          element={<EmailVerification />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ================= LEGAL ================= */}

        <Route
          path="/terms"
          element={<Terms />}
        />

        <Route
          path="/privacy"
          element={<Privacy />}
        />


        {/* ================= DASHBOARD ================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* ================= SHIPMENTS ================= */}

        <Route
          path="/shipments"
          element={<Shipments />}
        />

        <Route
          path="/myshipments"
          element={<MyShipments />}
        />

        <Route
          path="/CreateShipment"
          element={<CreateShipment />}
        />

        <Route
          path="/ShipmentDetails"
          element={<ShipmentDetails />}
        />


        {/* ================= DISPATCH ================= */}

        <Route
          path="/dispatch-availability"
          element={<DispatchAvailability />}
        />


        {/* ================= VERIFICATION ================= */}

<Route
  path="/verify-role"
  element={<VerifyRole />}
/>

<Route
  path="/verify-role/VerifyVendor"
  element={<VerifyVendor />}
/>

<Route
  path="/verify-role/VerifyDispatch"
  element={<VerifyDispatch />}
/>

<Route
  path="/verify-role/both"
  element={<VerifyBoth />}
/>

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/admin/create-shipment"
          element={<CreateShipment />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

