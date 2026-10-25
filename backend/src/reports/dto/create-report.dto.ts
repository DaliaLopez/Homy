import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(200)
    reason!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(1000)
    description!: string;

    @IsUUID()
    @IsNotEmpty()
    reportedUserId!: string;

    @IsUUID()
    @IsNotEmpty()
    requestId!: string;
}