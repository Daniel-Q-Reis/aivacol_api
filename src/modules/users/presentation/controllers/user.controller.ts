import { Controller, Get, Headers, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { UserService } from '../../application/services/user.service';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Lists users (protected read-only endpoint)' })
  @ApiResponse({ status: 200, type: UserResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findAll(
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<UserResponseDto[]> {
    return this.userService.findAll({ userId, correlationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets user by id (without password hash)' })
  @ApiParam({ name: 'id', description: 'User id (UUID)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.USER_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<UserResponseDto> {
    return this.userService.findById(id, { userId, correlationId });
  }
}
