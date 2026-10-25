import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateServiceDto {
    @IsString()
    @IsOptional()
    @MinLength(3)
    @MaxLength(500)
    name?: string;

    @IsString()
    @IsOptional()
    @MinLength(10)
    @MaxLength(800)
    description?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    workerId?: string;
}