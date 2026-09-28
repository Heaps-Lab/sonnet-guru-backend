import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MemoryMonitorService } from './common/services/memory-monitor.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly memoryMonitorService: MemoryMonitorService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    const memoryStats = this.memoryMonitorService.getMemoryStats();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      memory: memoryStats,
      uptime: process.uptime(),
      version: process.version,
    };
  }

  @Get('memory/gc')
  forceGarbageCollection() {
    const executed = this.memoryMonitorService.forceGarbageCollection();
    return {
      message: executed
        ? 'Garbage collection executed'
        : 'Garbage collection not available',
      executed,
      memoryAfter: this.memoryMonitorService.getMemoryStats(),
    };
  }
}
