export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
  ...rest
}) {
  const variantClass = variant === "secondary" ? "btn-secondary" : variant === "danger" ? "btn-danger" : "btn-primary";

  return (
    <button
      type={type}
      className={`btn ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
      style={fullWidth ? { width: "100%" } : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
