import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  async function handleLogin(asAdmin = false) {
    setError("");
    const endpoint = asAdmin ? "/auth/login-admin" : "/auth/login";
    const data = await api(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      localStorage.setItem("token", data.token);
      if (redirect) {
        navigate(redirect);
      } else if (asAdmin) {
        navigate("/admin");
      } else {
        const me = await api("/auth/me");
        const roleRedirects = { patient: "/patient", doctor: "/doctor", admin: "/admin" };
        navigate(roleRedirects[me.role] || "/");
      }
    } else {
      setError(data.message || "Неверный email или пароль");
    }
  }

  return (
    <MainLayout>
      <div className="auth-page">
        <h2 className="section-title">Вход в личный кабинет</h2>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary" onClick={() => handleLogin(false)}>
            Войти
          </button>

          <button className="btn btn-outline admin-login-btn" onClick={() => handleLogin(true)}>
            Войти как администратор
          </button>

          <p className="auth-link">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
