import type { ReactNode } from "react";
import Icon from "./icon";

type NoticeProps = { tone?: "olive" | "danger" | "neutral"; children: ReactNode; role?: "alert" | "status" };

/** Aviso en línea (errores de formularios, confirmaciones, ayudas). */
export default function Notice({ tone = "olive", children, role }: NoticeProps) {
  const className = tone === "olive" ? "notice" : `notice notice--${tone}`;
  return (
    <div className={className} role={role ?? (tone === "danger" ? "alert" : "status")}>
      <Icon name={tone === "danger" ? "alert" : "checkCircle"} size={18} />
      <div>{children}</div>
    </div>
  );
}
