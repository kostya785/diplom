import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import { getDoctorPhotoUrl } from "../../lib/doctorPhoto";
import "./Doctors.css";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    api("/doctor").then((data) => Array.isArray(data) && setDoctors(data));
  }, []);

  return (
    <MainLayout>
      <h2 className="section-title">Наши врачи</h2>
      <p className="page-subtitle">Квалифицированные специалисты с многолетним опытом работы</p>

      <div className="doctors-grid">
        {doctors.map((doc) => (
          <Link key={doc.id} to={`/doctors/${doc.id}`} className="doctor-card">
            <img className="doctor-card-photo" src={getDoctorPhotoUrl(doc)} alt={doc.name} />
            <h3>{doc.name}</h3>
            <span className="badge">{doc.specialty}</span>
            <p>{doc.description?.slice(0, 120)}...</p>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}
