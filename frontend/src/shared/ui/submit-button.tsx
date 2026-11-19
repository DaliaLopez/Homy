"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
};

/** Botón de envío que se deshabilita mientras la Server Action responde. */
export default function SubmitButton({ children, pendingLabel = "Enviando…", className = "btn btn--primary", disabled, name, value }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending || disabled} name={name} type="submit" value={value}>
      {pending ? pendingLabel : children}
    </button>
  );
}
