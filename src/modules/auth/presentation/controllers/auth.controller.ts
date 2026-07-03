import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { LoginDto } from '../../application/dtos/login.dto';
import { AuthService } from '../../application/services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Authenticates by nickname and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Authenticated successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload',
  })
  @ApiResponse({
    status: 401,
    description: ERROR_CATALOG.INVALID_CREDENTIALS.message,
    schema: {
      example: {
        statusCode: 401,
        code: ERROR_CATALOG.INVALID_CREDENTIALS.code,
        message: ERROR_CATALOG.INVALID_CREDENTIALS.message,
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message,
  })
  async login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    // Contract is intentionally minimal to keep auth boundary stable for API clients.
    return this.authService.login(dto);
  }
}
