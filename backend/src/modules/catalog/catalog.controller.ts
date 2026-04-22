import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('regions')
  findAllRegions() {
    return this.catalogService.findAllRegions();
  }

  @Get('record-fields')
  getRecordFieldCatalog() {
    return this.catalogService.getRecordFieldCatalog();
  }
}
