import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "../Login/Login.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [dataConsent, setDataConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function handleRegister() {
    setError("");
    setSuccess("");

    if (!dataConsent) {
      setError("Необходимо согласие на обработку персональных данных");
      return;
    }

    if (!gender) {
      setError("Укажите пол");
      return;
    }

    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        fullName,
        phone,
        birthDate,
        gender,
        address,
        dataConsent: true
      })
    });

    if (data.id) {
      setSuccess(data.message || "На вашу почту отправлено письмо с подтверждением регистрации");
    } else {
      setError(data.message || "Ошибка регистрации");
    }
  }

  return (
    <MainLayout>
      <div className="auth-page">
        <h2 className="section-title">Регистрация пациента</h2>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <div className="auth-form">
          <input type="text" placeholder="ФИО *" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input type="tel" placeholder="+7 (999) 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="date" placeholder="Дата рождения" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

          <div className="gender-select">
            <span className="gender-label">Пол *</span>
            <label className="gender-option">
              <input type="radio" name="gender" value="MALE" checked={gender === "MALE"} onChange={() => setGender("MALE")} />
              Мужской
            </label>
            <label className="gender-option">
              <input type="radio" name="gender" value="FEMALE" checked={gender === "FEMALE"} onChange={() => setGender("FEMALE")} />
              Женский
            </label>
          </div>

          <input type="text" placeholder="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input type="email" placeholder="example@mail.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Пароль *" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
            />
            <span>
              Я даю согласие на обработку персональных данных в соответствии с{" "}
              <Link to="/privacy">политикой конфиденциальности</Link> *
            </span>
          </label>

          <button className="btn btn-primary" onClick={handleRegister}>Создать аккаунт</button>

          <p className="auth-link">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
