import { ExternalToast } from "sonner";

export const defaultToastStyle: ExternalToast["style"] = {
  background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-mid), var(--color-accent-end))',
  border: '2px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  borderRadius: '12px',
  padding: '16px 20px',
  fontSize: '15px',
  fontWeight: '600',
  filter: 'drop-shadow(0 0 20px var(--color-glow))',
};

export const toastConfig = {
  style: defaultToastStyle,
};
