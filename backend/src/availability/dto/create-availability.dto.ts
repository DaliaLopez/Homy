import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(DAYS_OF_WEEK)
  day!: string;

  @IsString()
  @Matches(TIME_FORMAT, {
    message: 'startTime must use HH:mm or HH:mm:ss format',
  })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT, {
    message: 'endTime must use HH:mm or HH:mm:ss format',
  })
  endTime!: string;
}
