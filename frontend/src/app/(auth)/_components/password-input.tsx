"use client";

import { useState } from "react";
import Icon from "@/shared/ui/icon";

type PasswordInputProps = {
  id: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  minLength?: number;
  describedBy?: string;
};

/** Contraseña con botón para mostrarla u ocultarla. */
export default function PasswordInput({ id, autoComplete, placeholder, minLength, describedBy }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-input auth-input--action">
      <input
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        id={id}
        minLength={minLength}
        name="password"
        placeholder={placeholder}
        required
        type={show ? "text" : "password"}
      />
      <button aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="auth-input__action" onClick={() => setShow(!show)} type="button">
        <Icon name={show ? "eyeOff" : "eye"} size={20} />
      </button>
    </div>
  );
}
