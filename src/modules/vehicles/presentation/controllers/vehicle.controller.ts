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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { CreateVehicleDto } from '../../application/dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dtos/update-vehicle.dto';
import {
  VehicleListResponseDto,
  VehicleResponseDto,
} from '../../application/dtos/vehicle-response.dto';
import { VehicleService } from '../../application/services/vehicle.service';

@ApiTags('vehicles')
@ApiBearerAuth('bearer')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new vehicle' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 409, description: 'Vehicle uniqueness conflict' })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<VehicleResponseDto> {
    const actorId = userId ?? sub;
    return this.vehicleService.create(dto, actorId, correlationId);
  }

  @Get()
  @ApiOperation({ summary: 'Lists vehicles with defensive pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'sort', required: false, enum: ['createdAt', 'updatedAt', 'year'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Vehicles listed successfully' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<VehicleListResponseDto> {
    // Query coercion is intentionally delegated to service normalization to keep one source of truth.
    return this.vehicleService.findAll({ page, limit, sort, order }, { userId, correlationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets one vehicle by id' })
  @ApiParam({ name: 'id', description: 'Vehicle id (UUID)' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.VEHICLE_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.findById(id, { userId, correlationId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates an existing vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle id (UUID)' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload or id' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.VEHICLE_NOT_FOUND.message })
  @ApiResponse({ status: 409, description: 'Vehicle uniqueness conflict' })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<VehicleResponseDto> {
    const actorId = userId ?? sub;
    return this.vehicleService.update(id, dto, actorId, correlationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft deletes a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle id (UUID)' })
  @ApiResponse({ status: 200, description: 'Vehicle removed successfully' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.VEHICLE_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ message: string }> {
    const actorId = userId ?? sub;
    await this.vehicleService.delete(id, actorId, correlationId);
    return {
      message: 'Veículo removido com sucesso',
    };
  }
}
