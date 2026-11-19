"use client";

import { useActionState, useState } from "react";
import { register } from "@/shared/actions/auth";
import { colombiaDepartments } from "@/lib/colombia";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";
import PasswordInput from "./password-input";

type RegisterRole = "user" | "worker";

const copy: Record<RegisterRole, { phoneHint: string; phoneHintShort: string; cityLabel: string; cityHint: string; cityHintShort: string }> = {
  worker: {
    phoneHint: "Los clientes te contactarán por este número cuando confirmes un servicio.",
    phoneHintShort: "Los clientes te contactarán por este número.",
    cityLabel: "¿En qué ciudad trabajas?",
    cityHint: "Te llegarán solicitudes de clientes de tu ciudad. Después podrás elegir las zonas donde trabajas.",
    cityHintShort: "Te llegarán solicitudes de clientes de tu ciudad.",
  },
  user: {
    phoneHint: "El profesional te contactará por este número cuando confirme tu servicio.",
    phoneHintShort: "El profesional te contactará por este número.",
    cityLabel: "¿En qué ciudad vives?",
    cityHint: "Te mostraremos profesionales verificados de tu ciudad.",
    cityHintShort: "Te mostraremos profesionales de tu ciudad.",
  },
};

export default function RegisterForm({ role }: { role: RegisterRole }) {
  const [state, action] = useActionState(register, undefined);
  const [department, setDepartment] = useState("");
  const cities = colombiaDepartments.find((item) => item.name === department)?.cities ?? [];
  const text = copy[role];

  return (
    <form action={action} className="auth-form">
      <input name="role" type="hidden" value={role} />
      {state?.error && <Notice tone="danger">{state.error}</Notice>}

      <div className="auth-field">
        <label htmlFor="name">Nombre completo</label>
        <div className="auth-input auth-input--icon-mobile">
          <Icon className="auth-input__icon" name="user" size={18} />
          <input autoComplete="name" id="name" minLength={2} name="name" placeholder="Ej. Carlos Mendoza" required type="text" />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="email">Correo electrónico</label>
        <div className="auth-input auth-input--icon-mobile">
          <Icon className="auth-input__icon" name="mail" size={18} />
          <input autoComplete="email" id="email" name="email" placeholder="tu@correo.com" required type="email" />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="phone">Celular</label>
        <div className="auth-input auth-input--icon-mobile">
          <Icon className="auth-input__icon" name="phone" size={18} />
          <input aria-describedby="phone-hint" autoComplete="tel" id="phone" name="phone" placeholder="300 000 0000" required type="tel" />
        </div>
        <span className="auth-hint" id="phone-hint">
          <span className="auth-hint--desktop">{text.phoneHint}</span>
          <span className="auth-hint--mobile">{text.phoneHintShort}</span>
        </span>
      </div>

      <div className="auth-field">
        <span className="auth-field__label" id="city-label">{text.cityLabel}</span>
        <div aria-labelledby="city-label" className="auth-pair" role="group">
          <div>
            <label className="sr-only" htmlFor="department">Departamento</label>
            <select className="auth-select" id="department" name="department" onChange={(event) => setDepartment(event.target.value)} required value={department}>
              <option value="">Departamento</option>
              {colombiaDepartments.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="city">Ciudad o municipio</label>
            <select className="auth-select" disabled={!department} id="city" key={department} name="city" required>
              <option value="">Ciudad o municipio</option>
              {cities.map((city) => <option key={city}>{city}</option>)}
            </select>
          </div>
        </div>
        <span className="auth-hint">
          <span className="auth-hint--desktop">{text.cityHint}</span>
          <span className="auth-hint--mobile">{text.cityHintShort}</span>
        </span>
      </div>

      <div className="auth-field">
        <label htmlFor="password">Contraseña</label>
        <PasswordInput autoComplete="new-password" describedBy="password-hint" id="password" minLength={15} placeholder="Crea una contraseña segura" />
        <span className="auth-hint" id="password-hint">Mínimo 15 caracteres, sin espacios</span>
      </div>

      <SubmitButton className="auth-submit" pendingLabel="Creando tu cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
