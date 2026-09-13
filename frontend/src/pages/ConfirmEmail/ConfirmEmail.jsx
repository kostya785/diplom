import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { api } from "../../lib/api";
import "./ConfirmEmail.css";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  
  
  const isCalled = useRef(false);

  useEffect(() => {
   
    if (isCalled.current) return;

    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token) {
      setStatus("error");
      setMessage("Отсутствует токен подтверждения");
      return;
    }

   
    isCalled.current = true;
    verifyEmail(token, action);
  }, [searchParams]);

  async function verifyEmail(token, action) {
    try {
      const res = await api("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token, action: action || "confirm" })
      });

      if (res.message) {
        setStatus("success");
        setMessage(res.message);
        
        if (action !== "reject") {
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } else {
        setStatus("error");
        setMessage(res.error || "Ошибка подтверждения");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Ошибка сервера при подтверждении email");
    }
  }

  return (
    <MainLayout>
      <div className="confirm">
        {status === "loading" && (
          <>
            <h2>Подтверждение email</h2>
            <p>Обработка запроса...</p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="confirm-success">✓ {message}</h2>
            <p>Вы будете перенаправлены на страницу входа через несколько секунд.</p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="confirm-error">✕ Ошибка</h2>
            <p>{message}</p>
            <button className="btn btn-primary" onClick={() => navigate("/register")}>
              Вернуться к регистрации
            </button>
          </>
        )}
      </div>
    </MainLayout>
  );
}