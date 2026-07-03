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
import { BrandService } from '../../application/services/brand.service';
import { BrandResponseDto } from '../../application/dtos/brand-response.dto';
import { CreateBrandDto } from '../../application/dtos/create-brand.dto';
import { UpdateBrandDto } from '../../application/dtos/update-brand.dto';

@ApiTags('brands')
@ApiBearerAuth('bearer')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a brand' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, type: BrandResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 409, description: ERROR_CATALOG.DUPLICATE_BRAND_NAME.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BrandResponseDto> {
    return this.brandService.create(dto, userId ?? sub, correlationId);
  }

  @Get()
  @ApiOperation({ summary: 'Lists brands' })
  @ApiResponse({ status: 200, type: BrandResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findAll(
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BrandResponseDto[]> {
    return this.brandService.findAll({ userId, correlationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets brand by id' })
  @ApiParam({ name: 'id', description: 'Brand id (UUID)' })
  @ApiResponse({ status: 200, type: BrandResponseDto })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.BRAND_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BrandResponseDto> {
    return this.brandService.findById(id, { userId, correlationId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates brand by id' })
  @ApiParam({ name: 'id', description: 'Brand id (UUID)' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({ status: 200, type: BrandResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload or id' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.BRAND_NOT_FOUND.message })
  @ApiResponse({ status: 409, description: ERROR_CATALOG.DUPLICATE_BRAND_NAME.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BrandResponseDto> {
    return this.brandService.update(id, dto, userId ?? sub, correlationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft deletes brand by id' })
  @ApiParam({ name: 'id', description: 'Brand id (UUID)' })
  @ApiResponse({ status: 200, description: 'Brand removed successfully' })
  @ApiResponse({ status: 401, description: ERROR_CATALOG.UNAUTHORIZED.message })
  @ApiResponse({ status: 404, description: ERROR_CATALOG.BRAND_NOT_FOUND.message })
  @ApiResponse({ status: 429, description: ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('sub') sub: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ message: string }> {
    await this.brandService.delete(id, userId ?? sub, correlationId);
    return {
      message: 'Marca removida com sucesso',
    };
  }
}
