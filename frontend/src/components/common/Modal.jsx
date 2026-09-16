export default function Modal({ title, isOpen, onClose, children, footer }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 480, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 18, color: "#6b7280" }}
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}
