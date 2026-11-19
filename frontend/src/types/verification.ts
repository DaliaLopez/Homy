import type { StoredFile } from "./file";

export type ItemStatus = "pending" | "approved" | "rejected";
export type VerificationStatus = "pending" | "verified" | "rejected" | "changes_requested";
export type DocumentKey = "profile" | "id" | "selfie";

export type VerificationDocument = {
  key: DocumentKey;
  label: string;
  file: StoredFile;
  status: ItemStatus;
  reasons: string[];
  comment: string | null;
};

export type VerificationCategory = {
  categoryId: string;
  name: string;
  note: string | null;
  files: StoredFile[];
  status: ItemStatus;
  reasons: string[];
  comment: string | null;
};

export type Verification = {
  id: string;
  status: VerificationStatus;
  type: "initial" | "category";
  documents: VerificationDocument[];
  categories: VerificationCategory[];
  verifiedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reviewedBy?: { id: string; name: string } | null;
  worker?: { id: string; user: { id: string; name: string; location: string | null; email?: string; phone?: string | null } };
};

export const documentDefs: { key: DocumentKey; label: string; hint: string }[] = [
  { key: "profile", label: "Foto de perfil", hint: "Una foto clara de tu cara, con buena luz." },
  { key: "id", label: "Cédula de ciudadanía", hint: "Frente y reverso, con los datos legibles." },
  { key: "selfie", label: "Foto con tu cédula", hint: "Tú sosteniendo la cédula junto a tu cara." },
];

export const documentRejectReasons = [
  "Ilegible o borroso",
  "El nombre no coincide",
  "Documento vencido",
  "La foto no coincide con la cédula",
  "Falta una cara del documento",
  "Otro",
];

export const categoryRejectReasons = [
  "No muestra trabajos de esta categoría",
  "Fotos borrosas o no se ve el trabajo",
  "La carta no tiene datos de contacto",
  "Está a nombre de otra persona",
  "Archivo ilegible",
  "Otro",
];

export const verificationStatusLabel: Record<VerificationStatus, string> = {
  pending: "En revisión",
  verified: "Aprobada",
  changes_requested: "Requiere correcciones",
  rejected: "Rechazada",
};
