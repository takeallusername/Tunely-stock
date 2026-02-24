import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const requestId = request.requestId || 'unknown';
    const method = request.method;
    const path = request.path || request.url;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        const logData = {
          requestId,
          method,
          path,
          statusCode,
          duration,
        };

        console.log(JSON.stringify(logData));
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        const errorCode =
          error instanceof HttpException
            ? error.message
            : 'INTERNAL_SERVER_ERROR';

        const logData = {
          requestId,
          method,
          path,
          statusCode,
          duration,
          errorCode,
        };

        console.log(JSON.stringify(logData));

        return throwError(() => error);
      }),
    );
  }
}
