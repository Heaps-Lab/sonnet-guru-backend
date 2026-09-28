import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private readonly MEMORY_THRESHOLD_MB = 500; // Alert when app uses > 500MB

  constructor() {
    // Monitor memory every 30 seconds
    setInterval(() => this.checkMemoryUsage(), 30000);
  }

  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    if (heapUsedMB > this.MEMORY_THRESHOLD_MB) {
      this.logger.warn(
        `High memory usage detected: ${heapUsedMB}MB heap, ${rssMB}MB RSS`,
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.log('Forced garbage collection executed');
      }
    }

    // Log memory stats every 5 minutes (10 intervals)
    if (Math.floor(Date.now() / 30000) % 10 === 0) {
      this.logger.log(
        `Memory usage - Heap: ${heapUsedMB}MB, RSS: ${rssMB}MB, External: ${Math.round(usage.external / 1024 / 1024)}MB`,
      );
    }
  }

  public getMemoryStats() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      timestamp: new Date().toISOString(),
    };
  }

  public forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      this.logger.log('Manual garbage collection executed');
      return true;
    }
    return false;
  }
}
