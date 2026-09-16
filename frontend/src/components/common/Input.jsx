export default function Input({ label, error, id, ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} className="input" {...rest} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
