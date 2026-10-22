import {
    BadRequestException,
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRulesService {
    ensureEmailIsAvailable(
        email: string,
        existingUser: UserEntity | null,
    ): void {
        if (existingUser) {
            throw new ConflictException(
                `El correo electrónico ${email} ya se encuentra registrado`,
            );
        }
    }

    ensureValidPhoneFormat(phone: string): void {
        const phoneRegex = /^[0-9]{7,15}$/;
        if (!phoneRegex.test(phone)) {
            throw new BadRequestException(
                'El número de teléfono debe contener entre 7 y 15 dígitos numéricos',
            );
        }
    }

    ensureCanUpdateProfile(currentUserId: number, targetUserId: number): void {
        if (currentUserId !== targetUserId) {
            throw new BadRequestException(
                'No tienes permiso para modificar la información de otra cuenta',
            );
        }
    }
}