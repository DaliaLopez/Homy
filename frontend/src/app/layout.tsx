import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "../styles/index.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Homy · Servicios para tu hogar",
    template: "%s · Homy",
  },
  description:
    "Encuentra profesionales verificados para electricidad, plomería, limpieza, pintura y más en tu ciudad.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={urbanist.variable} lang="es">
      <body>{children}</body>
    </html>
  );
}
