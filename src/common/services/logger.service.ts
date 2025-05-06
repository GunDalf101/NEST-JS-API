import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  setContext(context: string): void {
    this.context = context;
  }

  error(message: string, trace?: string, context?: string): void {
    if (!context && this.context) {
      context = this.context;
    }
    super.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    if (!context && this.context) {
      context = this.context;
    }
    super.warn(message, context);
  }

  log(message: string, context?: string): void {
    if (!context && this.context) {
      context = this.context;
    }
    super.log(message, context);
  }

  debug(message: string, context?: string): void {
    if (!context && this.context) {
      context = this.context;
    }
    super.debug(message, context);
  }

  verbose(message: string, context?: string): void {
    if (!context && this.context) {
      context = this.context;
    }
    super.verbose(message, context);
  }
} 