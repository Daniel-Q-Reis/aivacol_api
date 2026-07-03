import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'f07f5f8d-6c69-4f93-8cd2-8229ce1cf3aa' })
  @IsUUID()
  brandId!: string;
}
