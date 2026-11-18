import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RequestStatus } from '../enums/request-status.enum';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status!: RequestStatus;

  /** Obligatorios al cancelar: el motivo y una nota para la otra persona. */
  @ValidateIf(
    (dto: UpdateRequestStatusDto) => dto.status === RequestStatus.CANCELLED,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason?: string;

  @ValidateIf(
    (dto: UpdateRequestStatusDto) => dto.status === RequestStatus.CANCELLED,
  )
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  note?: string;
}
