"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/shared/actions/profile";
import { colombiaDepartments } from "@/lib/colombia";
import FilePicker from "@/shared/ui/file-picker";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Props = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  /**
   * Perfil del trabajador: el nombre y la foto son los que aprobó el administrador en la
   * verificación, así que el nombre se muestra deshabilitado (como el correo) y no aparece la
   * opción de subir otra foto.
   */
  lockIdentity?: boolean;
  worker?: { description: string; experience: string };
};

/** "Ciudad, Departamento" → partes para los selects. */
function splitLocation(location: string | null) {
  const [city = "", department = ""] = (location ?? "").split(",").map((part) => part.trim());
  return colombiaDepartments.some((item) => item.name === department) ? { city, department } : { city: "", department: "" };
}

/** Datos de cuenta editables (cliente, trabajador y administrador). */
export default function ProfileForm({ name, email, phone, location, lockIdentity = false, worker }: Props) {
  const [state, action] = useActionState(updateProfile, undefined);
  const initial = splitLocation(location);
  const [department, setDepartment] = useState(initial.department);
  const [city, setCity] = useState(initial.city);
  const [formKey, setFormKey] = useState(0);
  const cities = colombiaDepartments.find((item) => item.name === department)?.cities ?? [];

  const discard = () => {
    setDepartment(initial.department);
    setCity(initial.city);
    setFormKey((key) => key + 1);
  };

  return (
    <form action={action} className="form" key={formKey}>
      <input name="location" type="hidden" value={city && department ? `${city}, ${department}` : (location ?? "")} />
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <Notice>{state.ok}</Notice>}
      <div className="field">
        <label className="label" htmlFor="profile-name">
          Nombre completo
        </label>
        {/* Trabajador: nombre deshabilitado igual que el correo (no se envía al guardar). */}
        <input className="input" defaultValue={name} disabled={lockIdentity} id="profile-name" minLength={2} name={lockIdentity ? undefined : "name"} required />
      </div>
      <div className="form-grid form-grid--2">
        <div className="field">
          <label className="label" htmlFor="profile-email">
            Correo electrónico
          </label>
          <input className="input" defaultValue={email} disabled id="profile-email" type="email" />
        </div>
        <div className="field">
          <label className="label" htmlFor="profile-phone">
            Celular
          </label>
          <input className="input" defaultValue={phone ?? ""} id="profile-phone" inputMode="tel" name="phone" />
        </div>
      </div>
      <div className="form-grid form-grid--2">
        <div className="field">
          <label className="label" htmlFor="profile-department">
            Departamento
          </label>
          <select
            className="select"
            id="profile-department"
            onChange={(event) => {
              setDepartment(event.target.value);
              setCity("");
            }}
            value={department}
          >
            <option value="">Elige uno</option>
            {colombiaDepartments.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="profile-city">
            Ciudad o municipio
          </label>
          <select className="select" id="profile-city" onChange={(event) => setCity(event.target.value)} value={city}>
            <option value="">Elige una</option>
            {cities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      {worker && (
        <>
          <div className="field">
            <label className="label" htmlFor="profile-about">
              Sobre mí
            </label>
            <textarea className="textarea" defaultValue={worker.description} id="profile-about" maxLength={1000} name="description" placeholder="Cuéntales a los clientes quién eres y cómo trabajas." />
          </div>
          <div className="field">
            <label className="label" htmlFor="profile-experience">
              Experiencia
            </label>
            <input className="input" defaultValue={worker.experience} id="profile-experience" name="experience" placeholder="Ej. 8 años en instalaciones residenciales" />
          </div>
        </>
      )}
      {/* Trabajador: sin selector de foto; conserva la que envió en la verificación. */}
      {!lockIdentity && (
        <div className="field">
          <span className="label">Foto de perfil</span>
          <FilePicker accept="image/*" compact hint="JPG o PNG" label="Sube una foto:" max={1} maxSide={480} name="avatar" />
        </div>
      )}
      <div className="row row--wrap">
        <SubmitButton className="btn btn--primary" pendingLabel="Guardando…">
          Guardar cambios
        </SubmitButton>
        <button className="btn btn--outline" onClick={discard} type="button">
          Descartar
        </button>
      </div>
    </form>
  );
}
