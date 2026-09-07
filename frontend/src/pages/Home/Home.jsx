import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import { getDoctorPhotoUrl } from "../../lib/doctorPhoto";
import "./Home.css";

export default function Home() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

 
  function useCounter(target, duration = 2000) {
    const ref = useRef(null);
    const [value, setValue] = useState(0);
    const started = useRef(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !started.current) {
            started.current = true;
            animate();
          }
        },
        { threshold: 0.4 }
      );

      io.observe(el);
      return () => io.disconnect();
    }, []);

    function animate() {
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const current = Math.floor(progress * target);
        setValue(current);

        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    return { ref, value };
  }

  
  const exp = useCounter(15);
  const docs = useCounter(20);
  const serv = useCounter(50);

  
  useEffect(() => {
    api("/doctor").then((data) => Array.isArray(data) && setDoctors(data.slice(0, 4)));
    api("/service").then((data) => Array.isArray(data) && setServices(data.slice(0, 6)));
  }, []);

  return (
    <MainLayout>
      <section className="hero">
        <div className="hero-content">
          <h1>Забота о вашем здоровье — наш приоритет</h1>
          <p>
            Многопрофильная клиника «Константинополь Мед» — современная диагностика,
            опытные врачи и индивидуальный подход к каждому пациенту.
          </p>
          <div className="hero-actions">
            <Link to="/services" className="btn btn-primary">Записаться на приём</Link>
            <Link to="/doctors" className="btn btn-outline">Наши врачи</Link>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span ref={exp.ref} className="stat-num">{exp.value}+</span>
            <span className="stat-label">лет опыта</span>
          </div>

          <div className="stat">
            <span ref={docs.ref} className="stat-num">{docs.value}+</span>
            <span className="stat-label">специалистов</span>
          </div>

          <div className="stat">
            <span ref={serv.ref} className="stat-num">{serv.value}+</span>
            <span className="stat-label">видов услуг</span>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Популярные услуги</h2>
        <div className="card-grid">
          {services.map((s) => (
            <div key={s.id} className="card service-preview">
              <span className="badge">{s.category}</span>
              <h3>{s.name}</h3>
              <p className="price">{s.price.toLocaleString()} ₽</p>
              <Link to={`/services/${s.id}`} className="card-link">Подробнее →</Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/services" className="btn btn-outline">Все услуги</Link>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Наши специалисты</h2>
        <div className="card-grid">
          {doctors.map((doc) => (
            <div key={doc.id} className="card doctor-preview">
              <img className="doctor-preview-photo" src={getDoctorPhotoUrl(doc)} alt={doc.name} />
              <h3>{doc.name}</h3>
              <span className="badge">{doc.specialty}</span>
              <p className="doctor-desc">{doc.description?.slice(0, 100)}...</p>
              <Link to={`/doctors/${doc.id}`} className="card-link">Профиль врача →</Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/doctors" className="btn btn-outline">Все врачи</Link>
        </div>
      </section>

      <section className="cta-section">
        <h2>Запишитесь на приём онлайн</h2>
        <p>Выберите услугу, врача и удобное время — без очередей и звонков.</p>
        <Link to="/register" className="btn btn-primary">Создать аккаунт</Link>
      </section>
    </MainLayout>
  );
}
