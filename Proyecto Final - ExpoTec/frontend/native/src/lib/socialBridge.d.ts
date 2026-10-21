export const hasSocialReturn: boolean;
export const socialBridge: {
  pending(): { id: string; proof: string } | null;
  clear(): void;
  begin(): Promise<{ proof: string; challenge: string }>;
  redirect(id: string, url: string): void;
};
