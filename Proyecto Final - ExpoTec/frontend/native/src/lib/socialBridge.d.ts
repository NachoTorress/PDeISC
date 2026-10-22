export const hasSocialReturn: boolean;
export const socialBridge: {
  restore(): Promise<void>;
  start(
    provider: string,
    query: <T>(path: string, body: object) => Promise<T>,
  ): Promise<void>;
  pending(): { id: string; proof: string } | null;
  clear(): void;
  begin(): Promise<{ proof: string; challenge: string }>;
  redirect(id: string, url: string): void;
};
