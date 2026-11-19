import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AuthLogo from "@/app/(auth)/_components/auth-logo";
import LoginForm from "@/app/(auth)/_components/login-form";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { registered, error, next, admin } = await searchParams;
  const isAdmin = admin === "1";

  return (
    <>
      <section className="auth-side auth-side--login">
        <AuthLogo className="auth-logo--login" />
        <div className="auth-side__center">
          <div className="auth-box">
            <p className="auth-eyebrow">{isAdmin ? "Administración" : "Qué bueno verte"}</p>
            <h1 className="auth-title">{isAdmin ? "Acceso para administración" : "Hola de nuevo"}</h1>
            <p className="auth-lead">
              {isAdmin ? "Ingresa con tu cuenta de administrador." : "Ingresa tus datos para continuar."}
            </p>
            {registered === "1" && <Notice>Cuenta creada. Ya puedes iniciar sesión.</Notice>}
            {error === "expired" && <Notice tone="neutral">Tu sesión terminó. Vuelve a iniciar sesión.</Notice>}
            <LoginForm next={typeof next === "string" ? next : ""} />
            {!isAdmin && (
              <p className="auth-switch">
                ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
              </p>
            )}
          </div>
        </div>
        <Link className="auth-admin" href={isAdmin ? "/login" : "/login?admin=1"}>
          {isAdmin ? "Volver al acceso general" : "Acceso para administración"}
          <Icon name="chevronRight" size={16} />
        </Link>
      </section>

      <section aria-hidden="true" className="auth-visual auth-visual--photo">
        <Image alt="" fill priority sizes="(min-width: 1024px) 50vw, 0px" src="/assets/people/trabajo.jpg" />
        <div className="auth-visual__shade" />
        <div className="auth-visual__caption">
          <p>Profesionales verificados por Homy</p>
          <p className="auth-visual__headline">Tus clientes, tu agenda y tus servicios en un solo lugar</p>
        </div>
      </section>
    </>
  );
}
