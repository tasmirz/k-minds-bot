import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

declare module 'discord.js' {
  interface BaseInteraction {
    _shortCircuited?: boolean;
  }
}

@Injectable()
export class ShortCircuitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const args = context.getArgByIndex(0);
    const interaction = args?.[0];
    if (interaction && (interaction as any)._shortCircuited) {
      // reply already sent by guard. emit a single value to avoid EmptyError.
      return of(null);
    }
    return next.handle();
  }
}
