export type UserRole = 'client' | 'worker' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    role: UserRole;
    createdAt: Date;
}