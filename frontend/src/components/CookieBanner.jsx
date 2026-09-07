import { useState, useEffect } from "react";
import "./CookieBanner.css";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("cookieConsent", "accepted");
    setShow(false);
  }

  function handleReject() {
    localStorage.setItem("cookieConsent", "rejected");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <p className="cookie-text">
          Мы используем cookies для улучшения работы сайта. Продолжая использовать сайт, вы соглашаетесь с 
          <a href="/privacy" className="cookie-link">политикой конфиденциальности</a>.
        </p>
        <div className="cookie-buttons">
          <button className="btn btn-secondary cookie-btn" onClick={handleReject}>
            Отклонить
          </button>
          <button className="btn btn-primary cookie-btn" onClick={handleAccept}>
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
