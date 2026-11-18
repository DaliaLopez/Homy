import type { StoredFile } from '../../common/stored-file';

export type ItemStatus = 'pending' | 'approved' | 'rejected';

/** Documento general: foto de perfil, cédula o foto con la cédula. */
export type VerificationDocument = {
  key: 'profile' | 'id' | 'selfie';
  label: string;
  file: StoredFile;
  status: ItemStatus;
  reasons: string[];
  comment: string | null;
};

/** Categoría solicitada con su evidencia y la nota del trabajador. */
export type VerificationCategory = {
  categoryId: string;
  name: string;
  note: string | null;
  files: StoredFile[];
  status: ItemStatus;
  reasons: string[];
  comment: string | null;
};
