import { Controller, Get, Post, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('companies')
@ApiHeader({ name: 'x-user-id', description: '사용자 UUID', required: true })
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('search')
  @ApiOperation({ summary: 'DART에서 기업 검색' })
  async search(@Query('name') name: string) {
    return this.companyService.search(name);
  }

  @Post()
  @ApiOperation({ summary: '기업 등록' })
  async register(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companyService.register(userId, dto.corpCode, dto.corpName, dto.stockCode);
  }

  @Get()
  @ApiOperation({ summary: '등록된 기업 목록' })
  async findAll(@Headers('x-user-id') userId: string) {
    return this.companyService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '기업 상세 조회' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(Number(id));
  }

  @Post(':id/collect')
  @ApiOperation({ summary: '데이터 수집' })
  async collect(@Param('id') id: string) {
    return this.companyService.collect(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: '기업 삭제' })
  async delete(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.companyService.delete(Number(id), userId);
  }
}
