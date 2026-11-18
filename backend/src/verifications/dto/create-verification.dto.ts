import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StoredFileDto } from '../../common/stored-file';

export class VerificationDocumentDto {
  @IsIn(['profile', 'id', 'selfie'])
  key!: 'profile' | 'id' | 'selfie';

  @ValidateNested()
  @Type(() => StoredFileDto)
  file!: StoredFileDto;
}

export class VerificationCategoryDto {
  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoredFileDto)
  files!: StoredFileDto[];
}

export class CreateVerificationDto {
  @IsIn(['initial', 'category'])
  type!: 'initial' | 'category';

  /** Solo para la verificación inicial, si aún no existe el perfil profesional. */
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  experience?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  documents?: VerificationDocumentDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => VerificationCategoryDto)
  categories!: VerificationCategoryDto[];
}

/** Reenvío: solo los elementos rechazados, con sus archivos nuevos. */
export class ResubmitVerificationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  documents?: VerificationDocumentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationCategoryDto)
  categories?: VerificationCategoryDto[];
}
