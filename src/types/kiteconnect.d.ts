declare module "kiteconnect" {
  export class KiteTicker {
    constructor(params: { api_key: string; access_token: string });
    modeFull: string;
    connect(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    subscribe(tokens: number[]): void;
    setMode(mode: string, tokens: number[]): void;
  }
}
