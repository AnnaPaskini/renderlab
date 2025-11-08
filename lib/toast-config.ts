import { ExternalToast } from "sonner";

export const defaultToastStyle: ExternalToast["style"] = {
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
  border: '2px solid rgba(168, 85, 247, 0.6)',
  color: 'white',
  borderRadius: '12px',
  padding: '16px 20px',
  fontSize: '15px',
  fontWeight: '600',
  filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))',
};

export const toastConfig = {
  style: defaultToastStyle,
};
