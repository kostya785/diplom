import { useEffect, useState } from "react";
import MainLayout from "../../layout/MainLayout";
import "./Admin.css";
import { api } from "../../lib/api";

const STATUS_LABELS = {
  SCHEDULED: "Запланирован",
  COMPLETED: "Завершён",
  CANCELED: "Отменён"
};

export default function Admin() {
  const [tab, setTab] = useState("users");
  const [userRole, setUserRole] = useState(null);

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [authLogs, setAuthLogs] = useState([]);
  const [currentDatabase, setCurrentDatabase] = useState("primary");

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    email: "", password: "", name: "", specialty: "", description: "", serviceIds: []
  });

  const [showEditDoctor, setShowEditDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDoctor, setEditDoctor] = useState({
    email: "", name: "", specialty: "", description: "", serviceIds: []
  });

  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: "", price: "", description: "", category: ""
  });

  useEffect(() => {
    
    api("/auth/me").then((u) => {
      setUserRole(u.role);
      
      if (u.role === "tech_admin") {
        loadUsers();
        loadAuthLogs();
        loadCurrentDatabase();
      } else if (u.role === "clinic_admin") {
        loadDoctors();
        loadPatients();
        loadAppointments();
        loadServices();
      }
    });
  }, []);

  async function loadUsers() {
    const data = await api("/admin/users");
    if (Array.isArray(data)) setUsers(data);
  }

  async function loadDoctors() {
    const data = await api("/doctor");
    if (Array.isArray(data)) setDoctors(data);
  }

  async function loadPatients() {
    const data = await api("/patient");
    if (Array.isArray(data)) setPatients(data);
  }

  async function loadAppointments() {
    const data = await api("/appointment");
    if (Array.isArray(data)) setAppointments(data);
  }

  async function loadServices() {
    const data = await api("/service");
    if (Array.isArray(data)) setServices(data);
  }

  async function loadAuthLogs() {
    const data = await api("/admin/auth-logs");
    if (Array.isArray(data)) setAuthLogs(data);
  }

  async function loadCurrentDatabase() {
    const data = await api("/admin/database/current");
    if (data.currentDatabase) setCurrentDatabase(data.currentDatabase);
  }

  async function switchDatabase(target) {
    const data = await api("/admin/database/switch", {
      method: "POST",
      body: JSON.stringify({ target })
    });
    if (data.success) {
      setCurrentDatabase(target);
      alert(data.message);
    }
  }

  async function banUser(id, reason, banUntil) {
    const data = await api(`/admin/ban/${id}`, {
      method: "POST",
      body: JSON.stringify({ reason, banUntil })
    });
    if (data.id) {
      loadUsers();
      alert("Пользователь заблокирован");
    }
  }

  async function unbanUser(id) {
    const data = await api(`/admin/unban/${id}`, {
      method: "POST"
    });
    if (data.id) {
      loadUsers();
      alert("Пользователь разблокирован");
    }
  }

  async function resetPassword(id, newPassword) {
    const data = await api(`/admin/reset-password/${id}`, {
      method: "POST",
      body: JSON.stringify({ newPassword })
    });
    if (data.message) {
      alert(data.message);
    }
  }

  async function deleteUser(id) {
    if (!confirm("Вы уверены, что хотите полностью удалить пользователя? Это действие необратимо.")) {
      return;
    }

    const data = await api(`/admin/users/${id}`, {
      method: "DELETE"
    });
    if (data.message) {
      loadUsers();
      alert(data.message);
    }
  }

  async function changeRole(id, role) {
    await api(`/admin/role/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  async function addDoctor() {
    const res = await api("/doctor", {
      method: "POST",
      body: JSON.stringify(newDoctor)
    });

    if (res.doctor) {
      setDoctors((prev) => [...prev, res.doctor]);
      setShowAddDoctor(false);
      setNewDoctor({ email: "", password: "", name: "", specialty: "", description: "", serviceIds: [] });
      loadUsers();
    }
  }

  async function addService() {
    const res = await api("/service", {
      method: "POST",
      body: JSON.stringify({ ...newService, price: Number(newService.price) })
    });

    if (res.id) {
      setServices((prev) => [...prev, res]);
      setShowAddService(false);
      setNewService({ name: "", price: "", description: "", category: "" });
    }
  }

  async function deleteService(id) {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) {
      return;
    }

    const res = await api(`/service/${id}`, {
      method: "DELETE"
    });

    if (res.message) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function openEditDoctor(doctor) {
    setEditingDoctor(doctor);
    const existingServiceIds = doctor.services ? doctor.services.map((s) => s.serviceId) : [];
    setEditDoctor({
      email: doctor.user?.email || "",
      name: doctor.name,
      specialty: doctor.specialty,
      description: doctor.description || "",
      serviceIds: existingServiceIds
    });
    setShowEditDoctor(true);
  }

  async function saveDoctor() {
    const res = await api(`/doctor/${editingDoctor.id}`, {
      method: "PUT",
      body: JSON.stringify(editDoctor)
    });

    if (res.id) {
      setDoctors((prev) => prev.map((d) => (d.id === editingDoctor.id ? res : d)));
      setShowEditDoctor(false);
      setEditingDoctor(null);
      setEditDoctor({ email: "", name: "", specialty: "", description: "" });
    }
  }

  async function deleteDoctor(id) {
    if (!confirm("Вы уверены, что хотите удалить врача? Все будущие записи будут отменены.")) {
      return;
    }

    const res = await api(`/doctor/${id}`, {
      method: "DELETE"
    });

    if (res.doctor) {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      alert(res.message);
    }
  }

  return (
    <MainLayout>
      <h2 className="section-title">
        {userRole === "tech_admin" ? "Техническая администрация" : "Управление клиникой"}
      </h2>

      <div className="admin-tabs">
        {userRole === "tech_admin" && (
          <>
            <button onClick={() => setTab("users")} className={tab === "users" ? "active" : ""}>Пользователи</button>
            <button onClick={() => setTab("auth-logs")} className={tab === "auth-logs" ? "active" : ""}>Аудит авторизаций</button>
            <button onClick={() => setTab("database")} className={tab === "database" ? "active" : ""}>Базы данных</button>
          </>
        )}
        {userRole === "clinic_admin" && (
          <>
            <button onClick={() => setTab("doctors")} className={tab === "doctors" ? "active" : ""}>Врачи</button>
            <button onClick={() => setTab("patients")} className={tab === "patients" ? "active" : ""}>Пациенты</button>
            <button onClick={() => setTab("appointments")} className={tab === "appointments" ? "active" : ""}>Записи</button>
            <button onClick={() => setTab("services")} className={tab === "services" ? "active" : ""}>Услуги</button>
          </>
        )}
      </div>

      {tab === "users" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Email</th><th>Роль</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.role}</span></td>
                  <td>
                    {u.isBanned ? (
                      <span className="badge" style={{ background: "#dc3545" }}>Заблокирован</span>
                    ) : (
                      <span className="badge" style={{ background: "#28a745" }}>Активен</span>
                    )}
                  </td>
                  <td>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="tech_admin">tech_admin</option>
                      <option value="clinic_admin">clinic_admin</option>
                    </select>
                    {u.isBanned ? (
                      <button className="btn btn-outline" onClick={() => unbanUser(u.id)}>Разблокировать</button>
                    ) : (
                      <button className="btn btn-outline" onClick={() => {
                        const reason = prompt("Причина блокировки:");
                        if (reason) banUser(u.id, reason);
                      }}>Заблокировать</button>
                    )}
                    <button className="btn btn-outline" onClick={() => {
                      const newPass = prompt("Новый пароль:");
                      if (newPass) resetPassword(u.id, newPass);
                    }}>Сбросить пароль</button>
                    <button className="btn btn-outline" style={{ background: "#dc3545", color: "white", border: "none" }} onClick={() => deleteUser(u.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "auth-logs" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Email</th><th>IP</th><th>Успех</th><th>Причина</th><th>Дата</th></tr>
            </thead>
            <tbody>
              {authLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user?.id || "-"}</td>
                  <td>{log.email}</td>
                  <td>{log.ipAddress || "-"}</td>
                  <td>
                    {log.success ? (
                      <span className="badge" style={{ background: "#28a745" }}>Успех</span>
                    ) : (
                      <span className="badge" style={{ background: "#dc3545" }}>Ошибка</span>
                    )}
                  </td>
                  <td>{log.failureReason || "-"}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "database" && (
        <div className="admin-table-wrap">
          <div style={{ padding: "20px" }}>
            <h3>Текущая база данных: <span className="badge">{currentDatabase}</span></h3>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button className="btn btn-primary" onClick={() => switchDatabase("primary")}>
                Основная PostgreSQL
              </button>
              <button className="btn btn-outline" onClick={() => switchDatabase("backup_postgres")}>
                Резервная PostgreSQL
              </button>
              <button className="btn btn-outline" onClick={() => switchDatabase("mysql")}>
                MySQL (экстренный)
              </button>
            </div>
            <div style={{ marginTop: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "5px" }}>
              <p><strong>Основная PostgreSQL:</strong> Основная база данных для ежедневной работы</p>
              <p><strong>Резервная PostgreSQL:</strong> Резервная копия для аварийного переключения</p>
              <p><strong>MySQL:</strong> Экстренная база данных при блокировке PostgreSQL</p>
            </div>
          </div>
        </div>
      )}

      {tab === "doctors" && (
        <div>
          <button onClick={() => setShowAddDoctor(true)} className="btn btn-primary add-btn">Добавить врача</button>

          {showAddDoctor && (
            <div className="add-form">
              <input placeholder="Email" value={newDoctor.email} onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })} />
              <input placeholder="Пароль" type="password" value={newDoctor.password} onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })} />
              <input placeholder="ФИО" value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} />
              <input placeholder="Специальность" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} />
              <textarea placeholder="Описание" value={newDoctor.description} onChange={(e) => setNewDoctor({ ...newDoctor, description: e.target.value })} />
              <div style={{ marginTop: "10px" }}>
                <label>Услуги:</label>
                <div style={{ marginTop: "5px", maxHeight: "150px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                  {services.map((s) => (
                    <div key={s.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={newDoctor.serviceIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewDoctor({ ...newDoctor, serviceIds: [...newDoctor.serviceIds, s.id] });
                            } else {
                              setNewDoctor({ ...newDoctor, serviceIds: newDoctor.serviceIds.filter((id) => id !== s.id) });
                            }
                          }}
                        />
                        {s.name} ({s.category})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={addDoctor}>Создать</button>
              <button className="btn btn-outline" onClick={() => setShowAddDoctor(false)}>Отмена</button>
            </div>
          )}

          {showEditDoctor && editingDoctor && (
            <div className="add-form">
              <h3>Редактирование врача</h3>
              <input placeholder="Email" value={editDoctor.email} onChange={(e) => setEditDoctor({ ...editDoctor, email: e.target.value })} />
              <input placeholder="ФИО" value={editDoctor.name} onChange={(e) => setEditDoctor({ ...editDoctor, name: e.target.value })} />
              <input placeholder="Специальность" value={editDoctor.specialty} onChange={(e) => setEditDoctor({ ...editDoctor, specialty: e.target.value })} />
              <textarea placeholder="Описание" value={editDoctor.description} onChange={(e) => setEditDoctor({ ...editDoctor, description: e.target.value })} />
              <div style={{ marginTop: "10px" }}>
                <label>Услуги:</label>
                <div style={{ marginTop: "5px", maxHeight: "150px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                  {services.map((s) => (
                    <div key={s.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={editDoctor.serviceIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditDoctor({ ...editDoctor, serviceIds: [...editDoctor.serviceIds, s.id] });
                            } else {
                              setEditDoctor({ ...editDoctor, serviceIds: editDoctor.serviceIds.filter((id) => id !== s.id) });
                            }
                          }}
                        />
                        {s.name} ({s.category})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={saveDoctor}>Сохранить</button>
              <button className="btn btn-outline" onClick={() => setShowEditDoctor(false)}>Отмена</button>
            </div>
          )}

          <div className="card-grid">
            {doctors.map((d) => (
              <div key={d.id} className="card">
                <h3>{d.name}</h3>
                <span className="badge">{d.specialty}</span>
                <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>{d.description}</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>{d.user?.email}</p>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => openEditDoctor(d)}>Редактировать</button>
                  <button className="btn btn-secondary" style={{ background: "#e74c3c", color: "white", border: "none" }} onClick={() => deleteDoctor(d.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "patients" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ФИО</th><th>Email</th><th>Телефон</th><th>Адрес</th></tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.fullName}</td>
                  <td>{p.user?.email}</td>
                  <td>{p.phone || "—"}</td>
                  <td>{p.address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "appointments" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Врач</th><th>Пациент</th><th>Услуга</th><th>Дата</th><th>Оплата</th><th>Статус</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.doctor?.name}</td>
                  <td>{a.patient?.fullName}</td>
                  <td>{a.service?.name || "—"}</td>
                  <td>{new Date(a.date).toLocaleString("ru-RU")}</td>
                  <td>{a.paid ? "Оплачено" : "—"}</td>
                  <td className={`status-${a.status.toLowerCase()}`}>{STATUS_LABELS[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "services" && (
        <div>
          <button onClick={() => setShowAddService(true)} className="btn btn-primary add-btn">Добавить услугу</button>

          {showAddService && (
            <div className="add-form">
              <input placeholder="Название" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
              <input placeholder="Цена" type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
              <input placeholder="Категория" value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} />
              <textarea placeholder="Описание" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
              <button className="btn btn-primary" onClick={addService}>Создать</button>
              <button className="btn btn-outline" onClick={() => setShowAddService(false)}>Отмена</button>
            </div>
          )}

          <div className="card-grid">
            {services.map((s) => (
              <div key={s.id} className="card">
                <span className="badge">{s.category}</span>
                <h3>{s.name}</h3>
                <p style={{ fontWeight: 700, color: "var(--color-primary)" }}>{s.price.toLocaleString()} ₽</p>
                <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{s.description}</p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary" style={{ background: "#e74c3c", color: "white", border: "none" }} onClick={() => deleteService(s.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
