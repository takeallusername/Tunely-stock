import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('search')
  async search(@Query('name') name: string) {
    return this.companyService.search(name);
  }

  @Post()
  async register(
    @Body() body: { corpCode: string; corpName: string; stockCode?: string },
  ) {
    return this.companyService.register(
      body.corpCode,
      body.corpName,
      body.stockCode,
    );
  }

  @Get()
  async findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(Number(id));
  }

  @Post(':id/collect')
  async collect(@Param('id') id: string) {
    return this.companyService.collect(Number(id));
  }
}
