// src/components/schedule/FormField.tsx
import React from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon: React.ReactNode;
  fieldClassName: string;
}

export const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  icon,
  fieldClassName,
}: FormFieldProps) => (
  <div>
    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
        {icon}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={fieldClassName}
      />
    </div>
  </div>
);
