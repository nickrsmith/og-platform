import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { FindQueryDto } from './find-query.dto';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  targetSiteAddress: string;
}

/**
 * DTO for querying a list of subscriptions.
 * Extends the base pagination DTO to include the required filter.
 */
export class FindSubscriptionsQueryDto extends FindQueryDto {
  @IsString()
  @IsOptional()
  filterTargetSiteAddress?: string;
}

/**
 * Represents a single subscription relationship.
 */
export class SubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriberSiteAddress: string;

  @IsString()
  @IsNotEmpty()
  targetSiteAddress: string;

  @IsDateString()
  createdAt: string;
}

/**
 * The response for an endpoint that lists multiple subscriptions.
 */
export class PaginatedSubscriptionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionDto)
  data: SubscriptionDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
