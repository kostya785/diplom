import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>Константинополь Мед</h4>
          <p>Многопрофильная клиника с современным оборудованием и опытными специалистами.</p>
        </div>

        <div className="footer-col">
          <h4>Навигация</h4>
          <Link to="/doctors">Врачи</Link>
          <Link to="/services">Услуги</Link>
          <Link to="/register">Записаться</Link>
        </div>

        <div className="footer-col">
  <h4>Мы в соцсетях</h4>

  <div className="social-links">

    <a href="https://t.me/konstantinopolskie_rasskazy" target="_blank" rel="noopener noreferrer">
      <i className="fab fa-telegram"></i>
      
    </a>

    <a href="https://vk.com/k_onstantinople" target="_blank" rel="noopener noreferrer">
      <i className="fab fa-vk"></i>
    </a>

    <a href="https://www.instagram.com/kostya_nka?igsh=MWE0a2p3eWEzMjM1Zg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer">
      <i className="fab fa-instagram"></i>
    </a>

    <a href="https://github.com/kostya785" target="_blank" rel="noopener noreferrer">
      <i className="fab fa-github"></i>
    </a>

    <a href="mailto:kma785kma@gmail.com">
      <i className="fas fa-envelope"></i>
    </a>

  </div>
</div>


        <div className="footer-col">
          <h4>Режим работы</h4>
          <p>Пн–Пт: 8:00 – 20:00</p>
          <p>Сб-Вс: 9:00 – 18:00</p>
          
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Built by Konstantinopol</p>
      </div>
    </footer>
  );
}
