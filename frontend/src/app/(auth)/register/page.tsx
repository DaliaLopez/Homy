import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AuthLogo from "@/app/(auth)/_components/auth-logo";
import RegisterForm from "@/app/(auth)/_components/register-form";
import Icon from "@/shared/ui/icon";
import { getWorkers } from "@/lib/data";

export const metadata: Metadata = { title: "Crear cuenta" };

const roles = [
  { value: "user", title: "Necesito un servicio", text: "Encuentra y contrata trabajadores de confianza", icon: "home" as const },
  { value: "worker", title: "Ofrezco servicios", text: "Publica tus servicios y recibe solicitudes", icon: "tool" as const },
];

const intro = {
  worker: {
    chip: "Cuenta de profesional",
    title: "Empieza a ofrecer tus servicios",
    lead: "Completa tus datos. Después verificaremos tu perfil.",
    stepsTitle: "Tres pasos para recibir tus primeras solicitudes",
    steps: [
      ["Crea tu cuenta", "Tus datos de contacto y tu ciudad"],
      ["Verifica tu perfil", "Documentos generales y evidencia de tus categorías"],
      ["Publica tus servicios", "Cuando el administrador apruebe tu perfil"],
    ],
  },
  user: {
    chip: "Cuenta de cliente",
    title: "Encuentra ayuda para tu hogar",
    lead: "Completa tus datos para empezar a contratar.",
    stepsTitle: "Tres pasos para contratar tu primer servicio",
    steps: [
      ["Crea tu cuenta", "Tus datos de contacto y tu ciudad"],
      ["Elige un profesional", "Perfiles verificados, con reseñas y precios"],
      ["Agenda tu servicio", "Escoge un horario libre y confirma"],
    ],
  },
};

/** /register muestra la bienvenida (elegir rol); /register?role=… muestra el formulario. */
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { role } = await searchParams;
  if (role === "user" || role === "worker") return <RegisterStep role={role} />;
  return <Welcome />;
}

async function Welcome() {
  // Calificación promedio real de los profesionales verificados (se oculta si aún no hay).
  const rated = (await getWorkers()).filter((worker) => Number(worker.averageRating) > 0);
  const average = rated.length ? rated.reduce((sum, worker) => sum + Number(worker.averageRating), 0) / rated.length : null;

  return (
    <>
      <section aria-hidden="true" className="auth-visual auth-visual--welcome">
        <p className="auth-eyebrow">Servicios para tu hogar</p>
        <div className="auth-collage">
          <Image alt="" className="auth-collage__tall" height={680} src="/assets/people/trabajo.jpg" width={400} />
          <div className="auth-collage__col">
            <Image alt="" className="auth-collage__short" height={400} src="/assets/people/maria.png" width={400} />
            {average !== null && (
              <div className="auth-collage__rating">
                <p className="auth-collage__score">{average.toFixed(1)}</p>
                <p>Calificación promedio de profesionales verificados</p>
              </div>
            )}
          </div>
        </div>
        <h2 className="auth-visual__headline">Encuentra a la persona indicada, no solo un servicio</h2>
      </section>

      <section className="auth-side auth-side--welcome">
        <div className="auth-box auth-box--welcome">
          <div className="auth-welcome__brand">
            <p className="auth-welcome__hello">Bienvenido a</p>
            <AuthLogo className="auth-logo--welcome" />
          </div>
          {/* Formulario GET: funciona sin JavaScript y lleva a /register?role=… */}
          <form action="/register" className="auth-welcome__form">
            <h1 className="auth-roles__title" id="role-title">¿Cómo quieres usar Homy?</h1>
            <div aria-labelledby="role-title" className="auth-roles" role="radiogroup">
              {roles.map((item) => (
                <label className="auth-role" key={item.value}>
                  <input defaultChecked={item.value === "user"} name="role" type="radio" value={item.value} />
                  <span className="auth-role__icon"><Icon name={item.icon} size={24} /></span>
                  <span className="auth-role__text">
                    <span className="auth-role__title">{item.title}</span>
                    <span className="auth-role__sub">{item.text}</span>
                  </span>
                  <span aria-hidden="true" className="auth-role__radio" />
                </label>
              ))}
            </div>
            <div className="auth-welcome__actions">
              <button className="auth-submit" type="submit">
                Continuar
                <Icon className="auth-submit__arrow" name="chevronRight" size={18} />
              </button>
              <p className="auth-switch">
                ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function RegisterStep({ role }: { role: "user" | "worker" }) {
  const text = intro[role];

  return (
    <>
      <section className="auth-side auth-side--register">
        <div className="auth-box auth-box--register">
          <div className="auth-back">
            <Link aria-label="Volver" className="auth-back__btn" href="/register">
              <Icon name="arrowLeft" size={20} />
            </Link>
            <span>Crea tu cuenta</span>
          </div>
          <span className="auth-chip">{text.chip}</span>
          <h1 className="auth-title auth-title--register">{text.title}</h1>
          <p className="auth-lead">{text.lead}</p>
          <RegisterForm role={role} />
          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
          </p>
        </div>
      </section>

      <section aria-hidden="true" className="auth-visual auth-visual--steps">
        <p className="auth-eyebrow">Cómo empiezas en Homy</p>
        <h2 className="auth-visual__headline">{text.stepsTitle}</h2>
        <ol className="auth-steps">
          {text.steps.map(([title, detail], index) => (
            <li className="auth-step" key={title}>
              <span className={`auth-step__num${index === 0 ? " is-current" : ""}`}>{index + 1}</span>
              <div>
                <p className="auth-step__title">{title}</p>
                <p className="auth-step__detail">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
