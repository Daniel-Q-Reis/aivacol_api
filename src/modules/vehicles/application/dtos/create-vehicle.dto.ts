import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC1D23', description: 'Brazilian Mercosur license plate' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i)
  licensePlate!: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', description: '17-character VIN/chassis' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i)
  chassis!: string;

  @ApiProperty({ example: '00123456789', description: '11-digit RENAVAM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/)
  renavam!: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1886)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 'f07f5f8d-6c69-4f93-8cd2-8229ce1cf3aa' })
  @IsUUID()
  modelId!: string;
}
