import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(500)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(800)
    description!: string;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    price!: number;

    @IsUUID()
    @IsNotEmpty()
    categoryId!: string;

    @IsUUID()
    @IsNotEmpty()
    workerId!: string;
}