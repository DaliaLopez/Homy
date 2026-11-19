"use client";

import { useActionState } from "react";
import { login } from "@/shared/actions/auth";
import { supportWhatsAppUrl } from "@/lib/support";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";
import PasswordInput from "./password-input";

const forgotUrl = supportWhatsAppUrl("Hola, olvidé mi contraseña de Homy y necesito ayuda para recuperarla.");
const suspendedUrl = supportWhatsAppUrl("Hola, mi cuenta de Homy aparece suspendida y necesito ayuda.");

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="auth-form">
      <input name="next" type="hidden" value={next} />
      {state?.error && <Notice tone="danger">{state.error}</Notice>}
      {/* Solo con la cuenta suspendida: acceso directo a soporte por WhatsApp. */}
      {state?.suspended && (
        <a className="auth-support" href={suspendedUrl} rel="noreferrer" target="_blank">
          <Icon name="whatsapp" size={18} />
          Contactar a soporte
        </a>
      )}
      <div className="auth-field">
        <label htmlFor="email">Correo electrónico</label>
        <div className="auth-input auth-input--icon-mobile">
          <Icon className="auth-input__icon" name="mail" size={18} />
          <input autoComplete="email" id="email" name="email" placeholder="tu@correo.com" required type="email" />
        </div>
      </div>
      <div className="auth-field">
        <div className="auth-field__row">
          <label htmlFor="password">Contraseña</label>
          <a className="auth-forgot auth-forgot--desktop" href={forgotUrl} rel="noreferrer" target="_blank">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <PasswordInput autoComplete="current-password" id="password" placeholder="Tu contraseña" />
      </div>
      <a className="auth-forgot auth-forgot--mobile" href={forgotUrl} rel="noreferrer" target="_blank">
        ¿Olvidaste tu contraseña?
      </a>
      <SubmitButton className="auth-submit" pendingLabel="Entrando…">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
