declare module 'autocannon' {
  export interface NumericStat {
    average?: number;
    p50?: number;
    p99?: number;
  }

  export interface Result {
    requests: NumericStat;
    latency: NumericStat;
    throughput: NumericStat;
    errors?: number;
    non2xx?: number;
  }

  export interface RequestSetupContext {
    requests: number;
  }

  export interface RequestShape {
    path?: string;
  }

  export interface Options {
    url: string;
    connections?: number;
    duration?: number;
    headers?: Record<string, string>;
    setupRequest?: (req: RequestShape, context: RequestSetupContext) => RequestShape;
  }

  export interface Instance {
    on(event: 'done', handler: (result: Result) => void): void;
    on(event: 'error', handler: (error: Error) => void): void;
  }

  interface AutocannonFn {
    (options: Options): Instance;
    track(
      instance: Instance,
      options?: { renderProgressBar?: boolean; renderResultsTable?: boolean },
    ): void;
  }

  const autocannon: AutocannonFn;
  export default autocannon;
}
