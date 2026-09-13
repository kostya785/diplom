import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import { getDoctorPhotoUrl } from "../../lib/doctorPhoto";
import "./Doctor.css";

const STATUS_LABELS = {
  SCHEDULED: "Запланирован",
  COMPLETED: "Завершён",
  CANCELED: "Отменён"
};

export default function Doctor() {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [photoMessage, setPhotoMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [medicalData, setMedicalData] = useState({
    diagnosis: "",
    recommendations: "",
    treatment: "",
    attachments: []
  });
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");

  useEffect(() => {
    api("/appointment/doctor").then((data) => {
      if (Array.isArray(data)) setAppointments(data);
    });
    api("/doctor/me").then((data) => {
      if (!data.error) setProfile(data);
    });
  }, []);

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Выберите изображение (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage("Файл слишком большой (макс. 5 МБ)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      setPhotoMessage("");
      const res = await api("/doctor/me/photo", {
        method: "POST",
        body: JSON.stringify({ photo: reader.result })
      });
      setUploading(false);

      if (res.error) {
        setPhotoMessage(res.message);
      } else {
        setProfile(res);
        setPhotoMessage("Фото успешно обновлено");
      }
    };
    reader.readAsDataURL(file);
  }

  function openMedicalForm(appointment) {
    setSelectedAppointment(appointment);
    setMedicalData({
      diagnosis: "",
      recommendations: "",
      treatment: "",
      attachments: []
    });
    setShowMedicalForm(true);
    setRecordMessage("");
  }

  function handleAttachmentSelect(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        setRecordMessage(`Файл ${file.name} слишком большой (макс. 50 МБ)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setMedicalData(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            name: file.name,
            data: reader.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeAttachment(index) {
    setMedicalData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  }

  async function saveMedicalRecord() {
    if (!medicalData.diagnosis && !medicalData.recommendations && !medicalData.treatment && medicalData.attachments.length === 0) {
      setRecordMessage("Заполните хотя бы одно поле");
      return;
    }

    setSavingRecord(true);
    setRecordMessage("");

    const res = await api("/medical-record", {
      method: "POST",
      body: JSON.stringify({
        appointmentId: selectedAppointment.id,
        diagnosis: medicalData.diagnosis,
        recommendations: medicalData.recommendations,
        treatment: medicalData.treatment,
        attachments: medicalData.attachments
      })
    });

    setSavingRecord(false);

    if (res.error) {
      setRecordMessage(res.message);
    } else {
      setRecordMessage("Медицинская запись сохранена");
      setShowMedicalForm(false);
      setAppointments(prev => prev.map(a => 
        a.id === selectedAppointment.id 
          ? { ...a, medicalRecord: res, status: "COMPLETED" }
          : a
      ));
    }
  }

  return (
    <MainLayout>
      {profile && (
        <div className="doctor-profile-section">
          <div className="doctor-profile-photo">
            <img src={getDoctorPhotoUrl(profile)} alt={profile.name} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoSelect}
            />
            <button
              className="btn btn-outline photo-upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Загрузка..." : "Изменить фото"}
            </button>
            {photoMessage && <p className="photo-message">{photoMessage}</p>}
          </div>
          <div>
            <h2>{profile.name}</h2>
            <span className="badge">{profile.specialty}</span>
            <p className="doctor-email">{profile.user?.email}</p>
          </div>
        </div>
      )}

      <div className="doctor-header">
        <h2 className="section-title">Мои приёмы</h2>
        <Link to="/doctor/schedule" className="btn btn-primary">Управление расписанием</Link>
      </div>

      <div className="appointments-list">
        {appointments.length === 0 && <p className="empty-msg">Нет запланированных приёмов</p>}
        {appointments.map((a) => (
          <div key={a.id} className="appointment-card">
            <p><b>Пациент:</b> {a.patient?.fullName}</p>
            <p><b>Email:</b> {a.patient?.user?.email}</p>
            <p><b>Услуга:</b> {a.service?.name || "—"}</p>
            <p><b>Дата:</b> {new Date(a.date).toLocaleString("ru-RU")}</p>
            <p className={`status-${a.status.toLowerCase()}`}>
              <b>Статус:</b> {STATUS_LABELS[a.status] || a.status}
            </p>
            {a.medicalRecord ? (
              <p className="record-exists">✓ Медицинская запись добавлена</p>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => openMedicalForm(a)}
                style={{ marginTop: "10px" }}
              >
                Добавить медицинскую запись
              </button>
            )}
          </div>
        ))}
      </div>

      {showMedicalForm && (
        <div className="modal-overlay">
          <div className="modal-content medical-record-modal">
            <h3>Медицинская запись</h3>
            <p><b>Пациент:</b> {selectedAppointment?.patient?.fullName}</p>
            
            <div className="medical-form">
              <div className="form-group">
                <label>Диагноз:</label>
                <textarea
                  value={medicalData.diagnosis}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Рекомендации:</label>
                <textarea
                  value={medicalData.recommendations}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Лечение:</label>
                <textarea
                  value={medicalData.treatment}
                  onChange={(e) => setMedicalData(prev => ({ ...prev, treatment: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Диагностические данные (PNG, JPEG, DICOM):</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.dcm,.dicom"
                  onChange={handleAttachmentSelect}
                />
                {medicalData.attachments.length > 0 && (
                  <div className="attachments-list">
                    {medicalData.attachments.map((att, i) => (
                      <div key={i} className="attachment-item">
                        <span>{att.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {recordMessage && <p className="form-message">{recordMessage}</p>}

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowMedicalForm(false)}
                >
                  Отмена
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={saveMedicalRecord}
                  disabled={savingRecord}
                >
                  {savingRecord ? "Сохранение..." : "Добавить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
