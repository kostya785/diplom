import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "./ServiceInfo.css";

export default function ServiceInfo() {
  const { id } = useParams();
  const [service, setService] = useState(null);

  useEffect(() => {
    api(`/service/${id}`).then((data) => {
      if (!data.error) setService(data);
    });
  }, [id]);

  if (!service) return <MainLayout><p>Загрузка...</p></MainLayout>;

  return (
    <MainLayout>
      <div className="service-info">
        <span className="badge">{service.category}</span>
        <h2>{service.name}</h2>
        <p className="service-info-price">{service.price.toLocaleString()} ₽</p>

        <h3>Описание</h3>
        <p>{service.description}</p>

        <Link to={`/services/${id}/doctors`} className="btn btn-primary">
          Записаться на приём
        </Link>
      </div>
    </MainLayout>
  );
}
