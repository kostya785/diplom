import { useEffect, useState } from "react";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";

export default function DoctorSchedule() {
  const [day, setDay] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [interval, setInterval] = useState(30);
  const [mySchedule, setMySchedule] = useState([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await api("/schedule/doctor/me");
    console.log("Загруженное расписание:", data);
    if (Array.isArray(data)) setMySchedule(data);
  }

  async function createSchedule() {
    if (!day || !start || !end) {
      setMessage("Заполните все поля");
      return;
    }

    const res = await api("/schedule", {
      method: "POST",
      body: JSON.stringify({
        day,
        startTime: `${day}T${start}`,
        endTime: `${day}T${end}`,
        interval
      })
    });

    if (res.error) {
      setMessage(res.message);
    } else {
      setMessage("Расписание создано");
      setDay("");
      await load();
    }
  }

  return (
    <MainLayout>
      <h2 className="section-title">Моё расписание</h2>
      <p className="page-subtitle">Добавьте рабочие часы для записи пациентов</p>

      {!showForm && (
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: "20px" }}>
          Добавить расписание
        </button>
      )}

      {showForm && (
        <div className="add-form">
          <label>Дата</label>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />

          <label>Начало приёма</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />

          <label>Конец приёма</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />

          <label>Интервал (минуты)</label>
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            <option value="15">15 минут</option>
            <option value="20">20 минут</option>
            <option value="30">30 минут</option>
            <option value="60">60 минут</option>
          </select>

          <button className="btn btn-primary" onClick={createSchedule}>Создать расписание</button>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ marginLeft: "10px" }}>Отмена</button>
          {message && <p style={{ fontSize: 14, color: message.includes("создано") ? "#27ae60" : "#e74c3c" }}>{message}</p>}
        </div>
      )}

      <h3 className="subsection-title">Ваши расписания</h3>
      <div className="list">
        {mySchedule.length === 0 && <p className="empty-msg">Расписание пока не задано</p>}
        {mySchedule.map((s) => (
          <div key={s.id} className="card">
            <p><b>{new Date(s.day).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</b></p>
            <p>С {new Date(s.startTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} до {new Date(s.endTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
            <p>Интервал: {s.interval} минут</p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
