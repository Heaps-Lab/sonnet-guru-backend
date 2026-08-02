import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // Never wrap file/binary streams - doing so breaks video/file
        // streaming since NestJS relies on the raw StreamableFile/Buffer
        // being the final emitted value to pipe it correctly.
        if (
          data instanceof StreamableFile ||
          Buffer.isBuffer(data) ||
          (data && typeof data.pipe === 'function')
        ) {
          return data;
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // If data is already in ApiResponse format, return as is
        if (data instanceof ApiResponse) {
          return data;
        }

        // Otherwise, wrap in success response
        return ApiResponse.success(data, 'Success', statusCode);
      }),
    );
  }
}
