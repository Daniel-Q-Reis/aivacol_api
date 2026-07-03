import { ApiProperty } from '@nestjs/swagger';

export class VehicleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  licensePlate!: string;

  @ApiProperty()
  chassis!: string;

  @ApiProperty()
  renavam!: string;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  modelId!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export interface VehicleListResponseDto {
  items: VehicleResponseDto[];
  page: number;
  limit: number;
  total: number;
}
