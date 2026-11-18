import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class ReviewServiceDto {
  @IsIn(['published', 'changes_requested', 'rejected'])
  status!: 'published' | 'changes_requested' | 'rejected';

  /** Obligatoria cuando se piden cambios o se rechaza. */
  @ValidateIf((dto: ReviewServiceDto) => dto.status !== 'published')
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @IsOptional()
  note?: string;
}
