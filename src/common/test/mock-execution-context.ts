import { ExecutionContext } from '@nestjs/common';

export function createMockExecutionContext(request: any = {}): ExecutionContext {
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getClass: () => ({}),
    getHandler: () => ({}),
    getType: () => 'http',
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
  };
  return ctx as ExecutionContext;
}