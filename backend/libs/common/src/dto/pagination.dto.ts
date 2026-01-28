import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }): number =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  pageSize = 20;
}

/**
 * DTO for pagination metadata included in list responses.
 */
export class PaginationDto {
  @IsInt()
  @Min(0)
  totalItems: number;

  @IsInt()
  @Min(0)
  totalPages: number;

  @IsInt()
  @Min(1)
  currentPage: number;

  @IsInt()
  @Min(1)
  pageSize: number;
}
