import { logout } from "@/shared/actions/auth";
import Icon from "@/shared/ui/icon";

/** Fila "Cerrar sesión" de las listas de perfil (borra la cookie en el servidor). */
export default function LogoutLink() {
  return (
    <form action={logout}>
      <button className="menu-list__item text-danger" style={{ width: "100%" }} type="submit">
        <Icon name="logout" />
        Cerrar sesión
        <span />
      </button>
    </form>
  );
}
