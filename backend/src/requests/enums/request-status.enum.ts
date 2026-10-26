export enum RequestStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected', // cuando el trabajador rechaza la solicitud
  CANCELLED = 'cancelled', // cuando el usuario cancela la solicitud
  EXPIRED = 'expired',
}
