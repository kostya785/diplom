import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, logout } from "../../lib/api";
import "./Header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <header className="header">
      <div className="header-inner">

        {}
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="Константинополь Мед" className="logo-img" />
          <div>
            <span className="logo-title">Константинополь Мед</span>
            <span className="logo-sub">Многопрофильная клиника</span>
          </div>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          ☰
        </button>

        <nav className={menuOpen ? "nav open" : "nav"}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Главная</Link>
          <Link to="/doctors" onClick={() => setMenuOpen(false)}>Врачи</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>Услуги</Link>
          {user?.role === "doctor" && (
            <Link to="/doctor/schedule" onClick={() => setMenuOpen(false)}>Расписание</Link>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              {user.role === "patient" && <Link to="/patient" className="btn-header">Кабинет</Link>}
              {user.role === "doctor" && <Link to="/doctor" className="btn-header">Приёмы</Link>}
              {user.role === "admin" && <Link to="/admin" className="btn-header">Админ</Link>}
              <button className="btn-logout" onClick={logout}>Выход</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-header">Вход</Link>
              <Link to="/register" className="btn-register">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
