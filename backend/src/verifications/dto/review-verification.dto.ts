import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ReviewItemBase {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  reasons?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ReviewDocumentDto extends ReviewItemBase {
  @IsIn(['profile', 'id', 'selfie'])
  key!: 'profile' | 'id' | 'selfie';
}

export class ReviewCategoryDto extends ReviewItemBase {
  @IsUUID()
  categoryId!: string;
}

export class ReviewVerificationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDocumentDto)
  documents?: ReviewDocumentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewCategoryDto)
  categories?: ReviewCategoryDto[];
}
