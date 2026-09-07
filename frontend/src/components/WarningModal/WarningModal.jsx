import "./WarningModal.css";

export default function WarningModal({ warnings, onConfirm, onCancel }) {
  if (!warnings?.length) return null;

  return (
    <div className="modal-overlay">
      <div className="warning-modal">
        <h3>Обратите внимание</h3>
        {warnings.map((w, i) => (
          <p key={i} className="warning-text">{w.message}</p>
        ))}
        <div className="warning-actions">
          <button className="btn btn-outline" onClick={onCancel}>Выбрать другого врача</button>
          <button className="btn btn-primary" onClick={onConfirm}>Продолжить запись</button>
        </div>
      </div>
    </div>
  );
}
