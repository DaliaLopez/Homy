import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '../enums/request-status.enum';

export class UpdateRequestStatusDto {
    @IsEnum(RequestStatus)
    @IsNotEmpty()
    status!: RequestStatus;
}