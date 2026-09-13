import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "./Services.css";

export default function Services() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    api("/service").then((data) => Array.isArray(data) && setServices(data));
  }, []);

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (category ? s.category === category : true)
  );

  return (
    <MainLayout>
      <h2 className="section-title">Услуги клиники</h2>

      <div className="filters">
        <input
          placeholder="Поиск услуги..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="service-list">
        {filtered.map((s) => (
          <div key={s.id} className="service-card">
            <span className="badge">{s.category}</span>
            <h3>{s.name}</h3>
            <p className="service-price">{s.price.toLocaleString()} ₽</p>
            <p className="service-desc">{s.description}</p>
            <Link to={`/services/${s.id}`} className="btn btn-primary">Подробнее</Link>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
