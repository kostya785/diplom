import { useEffect, useState } from "react";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "./Patient.css";

const STATUS_LABELS = {
  SCHEDULED: "Запланирован",
  COMPLETED: "Завершён",
  CANCELED: "Отменён"
};

export default function Patient() {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [complaints, setComplaints] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  useEffect(() => {
    api("/patient/me").then((data) => {
      if (!data.error) setPatient(data);
    });
    api("/appointment/my").then((data) => {
      if (Array.isArray(data)) setAppointments(data);
    });
    api("/medical-record/my").then((data) => {
      if (Array.isArray(data)) setMedicalRecords(data);
    });
  }, []);

  async function cancel(id) {
    const res = await api(`/appointment/${id}`, { method: "DELETE" });
    if (!res.error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELED" } : a))
      );
    }
  }

  function openRecordModal(record) {
    setSelectedRecord(record);
    setShowRecordModal(true);
  }

  async function downloadAttachment(attachmentId, originalName) {
    const token = localStorage.getItem("token");
    const url = `http://localhost:3000/medical-record/attachment/${attachmentId}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Ошибка при скачивании файла");
        return;
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Ошибка при скачивании файла");
    }
  }

  async function getAIRecommendation() {
    if (!complaints.trim() || complaints.trim().length < 5) {
      alert("Опишите жалобы подробнее (минимум 5 символов)");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    const res = await api("/ai/recommend", {
      method: "POST",
      body: JSON.stringify({ complaints: complaints.trim() })
    });

    setAiLoading(false);

    if (res.error) {
      alert(res.message);
    } else {
      setAiResult(res);
    }
  }

  function bookSuggestion(suggestion) {
    if (suggestion.doctorId) {
      window.location.href = `/doctor/${suggestion.doctorId}/schedule?service=${suggestion.serviceId || ""}`;
    } else if (suggestion.serviceId) {
      window.location.href = `/services/${suggestion.serviceId}/doctors`;
    }
  }

  return (
    <MainLayout>
      <h2 className="section-title">Личный кабинет</h2>

      {patient ? (
  <div className="patient-card">
    <p><b>ФИО:</b> {patient.fullName}</p>
    <p><b>Email:</b> {patient.user?.email || "—"}</p>
    <p><b>Телефон:</b> {patient.phone || "—"}</p>
    <p><b>Дата рождения:</b> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("ru-RU") : "—"}</p>
    <p><b>Адрес:</b> {patient.address || "—"}</p>

    {patient.telegramChatId ? (
      <p className="tg-connected">Telegram подключён ✔</p>
    ) : (
      <a
        href={patient.telegramLink || "https://t.me/konstantinopol_med_bot"}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-telegram"
      >
        Подключить Telegram
      </a>
    )}
  </div>
) : (
  <p>Загрузка...</p>
)}

      <div className="ai-assistant-section">
        <button 
          className="btn btn-primary ai-toggle-btn"
          onClick={() => setShowAiAssistant(!showAiAssistant)}
        >
          ИИ-помощник для выбора врача
        </button>

        {showAiAssistant && (
          <div className="ai-assistant-content">
            <h3>Опишите ваши жалобы</h3>
            <p className="ai-hint">ИИ-помощник подберёт подходящего врача и услугу на основе вашего описания</p>
            
            <textarea
              className="ai-input"
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              placeholder="Например: меня беспокоит головная боль, иногда кружится голова..."
              rows={4}
            />
            
            <button 
              className="btn btn-primary"
              onClick={getAIRecommendation}
              disabled={aiLoading}
            >
              {aiLoading ? "Анализирую..." : "Получить рекомендацию"}
            </button>

            {aiResult && (
              <div className="ai-result">
                <h4>Рекомендация:</h4>
                <p className="ai-reply">{aiResult.reply}</p>
                <p className="ai-source">Источник: {aiResult.source === "yandexgpt" ? "YandexGPT" : "База знаний"}</p>
                
                {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                  <div className="ai-suggestions">
                    <h5>Варианты записи:</h5>
                    {aiResult.suggestions.map((s, i) => (
                      <div key={i} className="ai-suggestion-card">
                        <p><b>Услуга:</b> {s.serviceName || s.service}</p>
                        <p><b>Врач:</b> {s.doctorName || s.doctor}</p>
                        <p><b>Причина:</b> {s.reason}</p>
                        {s.price && <p><b>Цена:</b> {s.price.toLocaleString()} ₽</p>}
                        <button 
                          className="btn btn-outline"
                          onClick={() => bookSuggestion(s)}
                        >
                          Записаться
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      <h3 className="subsection-title">Мои записи</h3>

      <div className="appointments-list">
        {appointments.length === 0 && <p className="empty-msg">У вас пока нет записей</p>}
        {appointments.map((a) => (
          <div key={a.id} className="appointment-card">
            <p><b>Врач:</b> {a.doctor?.name}</p>
            <p><b>Услуга:</b> {a.service?.name || "—"}</p>
            <p><b>Дата:</b> {a.date ? new Date(a.date).toLocaleString("ru-RU") : "—"}</p>
            <p><b>Оплата:</b> {a.paid ? "✓ Оплачено" : "Не оплачено"}</p>
            <p className={`status-${a.status.toLowerCase()}`}>
              <b>Статус:</b> {STATUS_LABELS[a.status] || a.status}
            </p>
            {a.status === "SCHEDULED" && (
              <button className="btn-cancel" onClick={() => cancel(a.id)}>Отменить</button>
            )}
          </div>
        ))}
      </div>

      <h3 className="subsection-title">Медицинские записи</h3>

      <div className="medical-records-list">
        {medicalRecords.length === 0 && <p className="empty-msg">У вас пока нет медицинских записей</p>}
        {medicalRecords.map((record) => (
          <div key={record.id} className="medical-record-card">
            <p><b>Врач:</b> {record.doctor?.name} ({record.doctor?.specialty})</p>
            <p><b>Дата:</b> {new Date(record.createdAt).toLocaleDateString("ru-RU")}</p>
            <p><b>Услуга:</b> {record.appointment?.service?.name || "—"}</p>
            {record.diagnosis && <p><b>Диагноз:</b> {record.diagnosis}</p>}
            {record.recommendations && <p><b>Рекомендации:</b> {record.recommendations}</p>}
            {record.treatment && <p><b>Лечение:</b> {record.treatment}</p>}
            {record.attachments && record.attachments.length > 0 && (
              <p><b>Вложения:</b> {record.attachments.length} файл(ов)</p>
            )}
            <button 
              className="btn btn-outline" 
              onClick={() => openRecordModal(record)}
              style={{ marginTop: "10px" }}
            >
              Подробнее
            </button>
          </div>
        ))}
      </div>

      {showRecordModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content medical-record-modal">
            <h3>Медицинская запись</h3>
            <p><b>Врач:</b> {selectedRecord.doctor?.name} ({selectedRecord.doctor?.specialty})</p>
            <p><b>Дата:</b> {new Date(selectedRecord.createdAt).toLocaleString("ru-RU")}</p>
            
            <div className="record-details">
              {selectedRecord.diagnosis && (
                <div className="record-section">
                  <h4>Диагноз:</h4>
                  <p>{selectedRecord.diagnosis}</p>
                </div>
              )}
              {selectedRecord.recommendations && (
                <div className="record-section">
                  <h4>Рекомендации:</h4>
                  <p>{selectedRecord.recommendations}</p>
                </div>
              )}
              {selectedRecord.treatment && (
                <div className="record-section">
                  <h4>Лечение:</h4>
                  <p>{selectedRecord.treatment}</p>
                </div>
              )}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div className="record-section">
                  <h4>Диагностические данные:</h4>
                  <div className="attachments-list">
                    {selectedRecord.attachments.map((att) => (
                      <div key={att.id} className="attachment-item">
                        <button 
                          onClick={() => downloadAttachment(att.id, att.originalName)}
                          className="attachment-link"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          {att.originalName}
                        </button>
                        <span className="attachment-type">
                          {att.fileType === "DICOM" ? "DICOM" : att.fileType === "IMAGE" ? "Изображение" : "Файл"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowRecordModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
