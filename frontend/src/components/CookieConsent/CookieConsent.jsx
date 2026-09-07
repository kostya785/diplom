import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsent.css";

const CONSENT_KEY = "cookieConsent";

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setCookie(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setCookie(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <p>
          Мы используем файлы cookie для улучшения работы сайта и анализа трафика.
          Продолжая использовать сайт, вы соглашаетесь с{" "}
          <Link to="/privacy">политикой конфиденциальности</Link>.
        </p>
        <div className="cookie-actions">
          <button className="btn btn-primary" onClick={accept}>Принять</button>
          <button className="btn btn-outline" onClick={decline}>Отклонить</button>
        </div>
      </div>
    </div>
  );
}
