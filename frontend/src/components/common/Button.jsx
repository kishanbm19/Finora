export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
  icon = null,
  style,
  ...rest
}) {
  const variantClass =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "danger"
      ? "btn-danger"
      : variant === "success"
      ? "btn-success"
      : variant === "ghost"
      ? "btn-ghost"
      : "btn-primary";

  const sizeClass = size === "sm" ? "btn-sm" : "";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...(fullWidth ? { width: "100%" } : {}),
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </button>
  );
}
