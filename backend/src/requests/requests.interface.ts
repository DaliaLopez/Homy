export type RequestStatus =
    | 'solicitado'
    | 'confirmado'
    | 'en_proceso'
    | 'completado'
    | 'cancelado';

export interface Request {
    id: number;
    userId: number;
    workerId: number;
    serviceId: number;
    date: string;
    time: string;
    address: string;
    description?: string;
    price: number;
    status: RequestStatus;
    createdAt: Date;
}