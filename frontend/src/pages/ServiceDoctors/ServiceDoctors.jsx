import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import { getDoctorPhotoUrl } from "../../lib/doctorPhoto";

const SPECIALTY_MAP = {
  "Терапия": "Терапевт",
  "Кардиология": "Кардиолог",
  "Неврология": "Невролог",
  "Гинекология": "Гинеколог",
  "Хирургия": "Хирург"
};

export default function ServiceDoctors() {
  const { id } = useParams();
  const [doctors, setDoctors] = useState([]);
  const [service, setService] = useState(null);

  useEffect(() => {
    api(`/service/${id}`).then((data) => {
      if (!data.error) setService(data);
    });
    api("/doctor").then((data) => {
      if (Array.isArray(data)) setDoctors(data);
    });
  }, [id]);

  
  const filtered = service
    ? doctors.filter((d) => {
        
        return d.services && d.services.some((s) => s.serviceId === Number(id));
      })
    : doctors;

  const list = filtered.length > 0 ? filtered : doctors;

  return (
    <MainLayout>
      <h2 className="section-title">Выберите врача</h2>
      {service && <p className="page-subtitle">Услуга: {service.name}</p>}

      <div className="card-grid">
        {list.map((d) => (
          <div key={d.id} className="card">
            <img className="doctor-card-photo" src={getDoctorPhotoUrl(d)} alt={d.name} />
            <h3>{d.name}</h3>
            <span className="badge">{d.specialty}</span>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>
              {d.description?.slice(0, 100)}...
            </p>
            <Link
              to={`/doctor/${d.id}/schedule?service=${id}`}
              className="btn btn-primary"
              style={{ marginTop: 16, display: "inline-block" }}
            >
              Выбрать время
            </Link>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
