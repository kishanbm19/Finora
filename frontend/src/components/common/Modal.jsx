import { IconClose } from "./Icons";

export default function Modal({ title, isOpen, onClose, children, footer, width = 500 }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 0,
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          background: "#ffffff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid var(--color-border)",
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <IconClose size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 24px" }}>{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              background: "#f8fafc",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              borderRadius: "0 0 14px 14px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
