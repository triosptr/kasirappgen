"use client";

type Props = {
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function IconButton({
  icon,
  label,
  onClick,
  className,
  iconClassName,
  disabled,
  type = "button",
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`focus-ring ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className || ""}`}
    >
      <span className={`msr ${iconClassName || ""}`}>{icon}</span>
    </button>
  );
}

