import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/lib/session";

/**
 * Bienvenida, login y registro. Con una sesión válida se va directo al inicio del rol.
 * Cada pantalla arma su propio panel visual (cambia de lado y de contenido).
 */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (user) redirect(homeForRole(user.role));

  return <div className="auth">{children}</div>;
}
