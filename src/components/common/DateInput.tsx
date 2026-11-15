import { useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { formatDateShort, parseDisplayDateToIso } from "../../utils/dateUtils";

interface DateInputProps {
  /** Fecha en formato ISO "aaaa-mm-dd" (o "" si no hay fecha). */
  value: string;
  /** Entrega la fecha escrita como ISO "aaaa-mm-dd" (o "" si está vacía). */
  onChange: (isoDate: string) => void;
  name?: string;
  id?: string;
  label?: ReactNode;
  labelClassName?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

/** Convierte los dígitos tecleados en "dd/mm/aaaa" sin obligar a escribir las barras. */
const maskDigits = (digits: string): string => {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

const digitsToIso = (digits: string): string | null => {
  if (digits.length !== 8) return null;
  return parseDisplayDateToIso(
    `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`,
  );
};

const INVALID_DATE_MESSAGE = "Ingresa una fecha válida (dd/mm/aaaa).";

/**
 * Campo de fecha de la app: se escribe manualmente como dd/mm/aaaa y por
 * dentro trabaja con ISO "aaaa-mm-dd".
 */
export const DateInput = ({
  value,
  onChange,
  name,
  id,
  label,
  labelClassName,
  placeholder = "dd/mm/aaaa",
  required = false,
  disabled = false,
  icon,
  className = "",
}: DateInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Mientras se escribe se usa el borrador; al salir se vuelve a la fecha ISO.
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const displayValue = draft ?? formatDateShort(value);

  const setValidity = (message: string) => {
    inputRef.current?.setCustomValidity(message);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setDraft(event.currentTarget.value);
    setInvalid(false);
    setValidity("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    setDraft(maskDigits(digits));

    if (digits.length === 8) {
      const iso = digitsToIso(digits);
      if (iso) {
        setInvalid(false);
        setValidity("");
        onChange(iso);
      } else {
        setInvalid(true);
        setValidity(INVALID_DATE_MESSAGE);
        onChange("");
      }
      return;
    }

    setInvalid(false);
    setValidity("");
    if (digits.length === 0) onChange("");
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const digits = event.currentTarget.value.replace(/\D/g, "");
    setDraft(null);

    if (digits.length === 0) {
      setInvalid(false);
      setValidity("");
      onChange("");
      return;
    }

    const iso = digitsToIso(digits);
    if (!iso) {
      setInvalid(true);
      setValidity(INVALID_DATE_MESSAGE);
      onChange("");
      return;
    }

    setInvalid(false);
    setValidity("");
    onChange(iso);
  };

  const input = (
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          {icon}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        id={id}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        aria-invalid={invalid || undefined}
        title={invalid ? INVALID_DATE_MESSAGE : undefined}
        className={className}
      />
    </div>
  );

  if (!label) {
    return (
      <div>
        {input}
        {invalid && (
          <p className="text-[11px] text-red-300 mt-1">{INVALID_DATE_MESSAGE}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className={labelClassName}>{label}</label>
      {input}
      {invalid && (
        <p className="text-[11px] text-red-300 mt-1">{INVALID_DATE_MESSAGE}</p>
      )}
    </div>
  );
};
