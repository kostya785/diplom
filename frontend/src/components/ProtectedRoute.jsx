import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../lib/api";

export default function ProtectedRoute({ children, role }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60 }}>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(role) ? role : [role];
  if (role && !allowedRoles.includes(user.role)) {
    const redirect = user.role === "tech_admin" || user.role === "clinic_admin" ? "/admin" : user.role === "doctor" ? "/doctor" : "/patient";
    return <Navigate to={redirect} replace />;
  }

  return children;
}
