import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(150)
    name?: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(150)
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    phone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    location?: string;

    @IsString()
    @IsOptional()
    @IsIn(['user', 'worker', 'admin'])
    role?: string;
}