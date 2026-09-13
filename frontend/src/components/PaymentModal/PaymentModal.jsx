import { useState } from "react";
import "./PaymentModal.css";

export default function PaymentModal({ service, doctor, slotDate, onClose, onSuccess }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e) {
    e.preventDefault();
    setError("");

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Введите номер карты (16 цифр)");
      return;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      setError("Срок действия: ММ/ГГ");
      return;
    }
    if (cvv.length < 3) {
      setError("Введите CVV");
      return;
    }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    onSuccess();
  }

  function formatCard(value) {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onClose}>×</button>
        <h2>Оплата услуги</h2>

        <div className="payment-summary">
          <p><b>{service?.name}</b></p>
          <p>Врач: {doctor?.name}</p>
          <p>Дата: {new Date(slotDate).toLocaleString("ru-RU")}</p>
          <p className="payment-amount">{service?.price?.toLocaleString()} ₽</p>
        </div>

        <form onSubmit={handlePay} className="payment-form">
          <label>Номер карты</label>
          <input
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCard(e.target.value))}
          />

          <div className="payment-row">
            <div>
              <label>Срок</label>
              <input
                placeholder="ММ/ГГ"
                value={expiry}
                maxLength={5}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2);
                  setExpiry(v);
                }}
              />
            </div>
            <div>
              <label>CVV</label>
              <input
                placeholder="123"
                type="password"
                maxLength={3}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          {error && <p className="payment-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={processing}>
            {processing ? "Обработка..." : `Оплатить ${service?.price?.toLocaleString()} ₽`}
          </button>
        </form>
      </div>
    </div>
  );
}
