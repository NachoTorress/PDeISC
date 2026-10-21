export const hasSocialReturn = false;
export const socialBridge = {
  pending: (): { id: string; proof: string } | null => null,
  clear: () => {},
  async begin(): Promise<{ proof: string; challenge: string }> {
    throw new Error("El acceso social para Android está pendiente.");
  },
  redirect() {
    throw new Error("El acceso social para Android está pendiente.");
  },
};
