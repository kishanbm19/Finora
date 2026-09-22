export default function Loader({ label = "Loading data…" }) {
  return (
    <div className="loader">
      <div className="spinner" />
      {label && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
    </div>
  );
}
