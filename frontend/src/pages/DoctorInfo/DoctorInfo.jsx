import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import { getDoctorPhotoUrl } from "../../lib/doctorPhoto";
import "./DoctorInfo.css";

export default function DoctorInfo() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    Promise.all([
      api(`/doctor/${id}`),
      api(`/service/doctor/${id}`)
    ]).then(([doctorData, servicesData]) => {
      if (!doctorData.error) setDoctor(doctorData);
      if (Array.isArray(servicesData)) setServices(servicesData);
    });
  }, [id]);

  if (!doctor) {
    return <MainLayout><p>Загрузка...</p></MainLayout>;
  }

  if (doctor.error) {
    return <MainLayout><p>Врач не найден</p></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="doctor-profile">
        <div className="doctor-profile-header">
          <img
            className="doctor-avatar-large-img"
            src={getDoctorPhotoUrl(doctor)}
            alt={doctor.name}
          />
          <div>
            <h1>{doctor.name}</h1>
            <span className="badge">{doctor.specialty}</span>
          </div>
        </div>

        <div className="doctor-profile-body">
          <h3>О специалисте</h3>
          <p>{doctor.description || "Опытный врач нашей клиники."}</p>

          {services.length > 0 && (
            <div className="doctor-services">
              <h3>Услуги врача</h3>
              <div className="services-list">
                {services.map((service) => (
                  <div key={service.id} className="service-card">
                    <h4>{service.name}</h4>
                    <p className="service-price">{service.price.toLocaleString()} ₽</p>
                    <Link 
                      to={`/doctor/${id}/schedule?service=${service.id}`}
                      className="btn btn-primary"
                    >
                      Записаться
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="doctor-actions">
            <Link to="/doctors" className="btn btn-outline">Все врачи</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
