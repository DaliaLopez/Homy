import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Archivo adjunto guardado como data URL (imágenes comprimidas o PDF).
 * El frontend comprime las imágenes antes de enviarlas.
 */
export class StoredFileDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsInt()
  @Min(0)
  @Max(10 * 1024 * 1024)
  size!: number;

  @IsString()
  @Matches(/^data:[\w/+.-]+;base64,/, {
    message: 'dataUrl must be a base64 data URL',
  })
  @MaxLength(14 * 1024 * 1024)
  dataUrl!: string;
}

export type StoredFile = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

/** Decorador compuesto para listas opcionales de archivos. */
export function FileList(max = 5) {
  return function (target: object, propertyKey: string) {
    IsOptional()(target, propertyKey);
    IsArray()(target, propertyKey);
    ArrayMaxSize(max)(target, propertyKey);
    ValidateNested({ each: true })(target, propertyKey);
    Type(() => StoredFileDto)(target, propertyKey);
  };
}

/** Quita el contenido de los archivos para respuestas de listados. */
export function withoutData(files: StoredFile[] | null | undefined) {
  return (files ?? []).map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
  }));
}
