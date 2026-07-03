import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { CreateModelDto } from '../../application/dtos/create-model.dto';
import { ModelResponseDto } from '../../application/dtos/model-response.dto';
import { UpdateModelDto } from '../../application/dtos/update-model.dto';
import { ModelService } from '../../application/services/model.service';

@ApiTags('models')
@ApiBearerAuth('bearer')
@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a model associated with a brand' })
  @ApiBody({ type: CreateModelDto })
  @ApiResponse({ status: 201, type: ModelResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.BRAND_NOT_FOUND.message })
  @ApiResponse({ status: 409, description: ERROR_CATALOG.DUPLICATE_MODEL_NAME.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async create(
    @Body() dto: CreateModelDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<ModelResponseDto> {
    // Controller keeps token-claim compatibility (`userId`/`sub`) and forwards normalized actor id.
    return this.modelService.create(dto, userId ?? sub, correlationId);
  }

  @Get()
  @ApiOperation({ summary: 'Lists models' })
  @ApiResponse({ status: 200, type: ModelResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findAll(
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<ModelResponseDto[]> {
    return this.modelService.findAll({ userId, correlationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets model by id' })
  @ApiParam({ name: 'id', description: 'Model id (UUID)' })
  @ApiResponse({ status: 200, type: ModelResponseDto })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.MODEL_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<ModelResponseDto> {
    return this.modelService.findById(id, { userId, correlationId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates model by id' })
  @ApiParam({ name: 'id', description: 'Model id (UUID)' })
  @ApiBody({ type: UpdateModelDto })
  @ApiResponse({ status: 200, type: ModelResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload or id' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: 'Model or brand not found' })
  @ApiResponse({ status: 409, description: ERROR_CATALOG.DUPLICATE_MODEL_NAME.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateModelDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<ModelResponseDto> {
    return this.modelService.update(id, dto, userId ?? sub, correlationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft deletes model by id' })
  @ApiParam({ name: 'id', description: 'Model id (UUID)' })
  @ApiResponse({ status: 200, description: 'Model removed successfully' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.MODEL_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ message: string }> {
    await this.modelService.delete(id, userId ?? sub, correlationId);
    return {
      message: 'Modelo removido com sucesso',
    };
  }
}
