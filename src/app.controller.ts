import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('status')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus(): { status: string } {
    return this.appService.getStatus();
  }
}
