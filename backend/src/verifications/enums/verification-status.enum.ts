export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  /** El administrador pidió corregir uno o más documentos o evidencias. */
  CHANGES_REQUESTED = 'changes_requested',
}
