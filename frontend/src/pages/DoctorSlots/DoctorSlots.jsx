import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import PaymentModal from "../../components/PaymentModal/PaymentModal";
import { api, getCurrentUser } from "../../lib/api";
import "./DoctorSlots.css";

export default function DoctorSlots() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const serviceId = params.get("service");
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(false);

  useEffect(() => {
    Promise.all([
      api(`/schedule/slots/${id}`),
      api(`/doctor/${id}`),
      serviceId ? api(`/service/${serviceId}`) : Promise.resolve(null),
      getCurrentUser()
    ]).then(([slotsData, doctorData, serviceData, user]) => {
      if (Array.isArray(slotsData)) setSlots(slotsData);
      if (!doctorData.error) setDoctor(doctorData);
      if (serviceData && !serviceData.error) setService(serviceData);
      if (!user) {
        navigate(`/login?redirect=/doctor/${id}/schedule?service=${serviceId}`);
      }
      setLoading(false);
    });
  }, [id, serviceId, navigate]);

  async function selectSlot(date) {
    setSelectedSlot(date);

    
    if (doctor && doctor.specialty === "Уролог") {
      const user = await getCurrentUser();
      if (user && user.gender === "FEMALE") {
        setWarnings([{ message: "Уролог специализируется на лечении мужчин. Пожалуйста, выберите другого врача." }]);
        setShowWarningModal(true);
        return;
      }
    }

    const res = await api("/ai/check-booking", {
      method: "POST",
      body: JSON.stringify({
        doctorId: Number(id),
        serviceId: serviceId ? Number(serviceId) : null
      })
    });

    if (res.hasWarnings && res.warnings && res.warnings.length > 0) {
      setWarnings(res.warnings);
      setShowWarningModal(true);
    } else {
      setShowPayment(true);
    }
  }

  function handleWarningConfirm() {
    setShowWarningModal(false);
    setShowPayment(true);
  }

  function handleWarningCancel() {
    setShowWarningModal(false);
    setSelectedSlot(null);
  }

  async function confirmBooking() {
    setBooking(true);
    const res = await api("/appointment/book", {
      method: "POST",
      body: JSON.stringify({
        doctorId: Number(id),
        serviceId: serviceId ? Number(serviceId) : null,
        date: selectedSlot,
        paid: true
      })
    });

    setBooking(false);
    setShowPayment(false);

    if (res.error) {
      alert(res.message);
      return;
    }

    alert("Запись подтверждена! Оплата прошла успешно.");
    navigate("/patient");
  }

  if (loading) {
    return <MainLayout><p>Загрузка...</p></MainLayout>;
  }

  const grouped = slots.reduce((acc, slot) => {
    const day = new Date(slot).toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  return (
    <MainLayout>
      <h2 className="section-title">Выберите время</h2>
      {doctor && <p className="page-subtitle">Врач: {doctor.name} — {doctor.specialty}</p>}
      {service && <p className="page-subtitle">Услуга: {service.name} — {service.price.toLocaleString()} ₽</p>}

      {slots.length === 0 ? (
        <div className="no-slots">
          <p>Нет доступных слотов. Попробуйте выбрать другого врача.</p>
          <Link to={`/services/${serviceId}/doctors`} className="btn btn-outline">Назад</Link>
        </div>
      ) : (
        Object.entries(grouped).map(([day, daySlots]) => (
          <div key={day} className="slots-day">
            <h3>{day}</h3>
            <div className="slots-grid">
              {daySlots.map((t) => (
                <button
                  key={t}
                  className="slot-btn"
                  disabled={booking}
                  onClick={() => selectSlot(t)}
                >
                  {new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {showPayment && (
        <PaymentModal
          service={service}
          doctor={doctor}
          slotDate={selectedSlot}
          onClose={() => setShowPayment(false)}
          onSuccess={confirmBooking}
        />
      )}

      {showWarningModal && (
        <div className="modal-overlay">
          <div className="modal-content warning-modal">
            <h3>⚠️ Внимание</h3>
            <div className="warnings-list">
              {warnings.map((warning, index) => (
                <div key={index} className="warning-item">
                  <p>{warning.message}</p>
                </div>
              ))}
            </div>
            <p className="warning-question">Вы хотите продолжить запись?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleWarningCancel}
              >
                Отмена
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleWarningConfirm}
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
