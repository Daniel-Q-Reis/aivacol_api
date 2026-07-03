import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'aivacol',
    description: 'Nickname used to authenticate API users',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(80)
  nickname!: string;

  @ApiProperty({
    example: 'ChangeMe123!',
    description: 'Raw password validated against stored bcrypt hash',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(120)
  password!: string;
}
