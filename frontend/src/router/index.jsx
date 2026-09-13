import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Home from "../pages/Home/Home";
import Doctors from "../pages/Doctors/Doctors";
import Services from "../pages/Services/Services";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Patient from "../pages/Patient/Patient";
import Doctor from "../pages/Doctor/Doctor";
import Admin from "../pages/Admin/Admin";
import DoctorInfo from "../pages/DoctorInfo/DoctorInfo";
import ServiceInfo from "../pages/ServiceInfo/ServiceInfo";
import ConfirmEmail from "../pages/ConfirmEmail/ConfirmEmail";
import ServiceDoctors from "../pages/ServiceDoctors/ServiceDoctors";
import DoctorSlots from "../pages/DoctorSlots/DoctorSlots";
import DoctorSchedule from "../pages/DoctorSchedule/DoctorSchedule";
import Privacy from "../pages/Privacy/Privacy";
import FAQ from "../pages/FAQ/FAQ";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "/faq", element: <FAQ /> },
  { path: "/doctors", element: <Doctors /> },
  { path: "/doctors/:id", element: <DoctorInfo /> },
  { path: "/services", element: <Services /> },
  { path: "/services/:id", element: <ServiceInfo /> },
  { path: "/services/:id/doctors", element: <ServiceDoctors /> },
  { path: "/doctor/:id/schedule", element: <DoctorSlots /> },
  {
    path: "/doctor/schedule",
    element: (
      <ProtectedRoute role="doctor">
        <DoctorSchedule />
      </ProtectedRoute>
    )
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/confirm", element: <ConfirmEmail /> },
  {
    path: "/patient",
    element: (
      <ProtectedRoute role="patient">
        <Patient />
      </ProtectedRoute>
    )
  },
  {
    path: "/doctor",
    element: (
      <ProtectedRoute role="doctor">
        <Doctor />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute role={["tech_admin", "clinic_admin"]}>
        <Admin />
      </ProtectedRoute>
    )
  }
]);

export default router;
