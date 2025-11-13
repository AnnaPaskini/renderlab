import { ExternalToast } from "sonner";

// Dark theme toast styling with colored icons only
export const defaultToastStyle: ExternalToast["style"] = {
  background: '#1a1a1a',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  borderRadius: '0.75rem',
  padding: '1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
};

export const toastConfig = {
  duration: 2500,
  style: defaultToastStyle,
  className: 'sonner-toast',
  descriptionClassName: 'sonner-toast-description',

  // Success toasts - green checkmark icon
  success: {
    style: defaultToastStyle,
    icon: '✓',
    iconTheme: {
      primary: '#10b981',
      secondary: '#1a1a1a',
    },
  },

  // Error toasts - red X icon
  error: {
    style: defaultToastStyle,
    icon: '×',
    iconTheme: {
      primary: '#ef4444',
      secondary: '#1a1a1a',
    },
  },

  // Warning toasts - orange warning icon
  warning: {
    style: defaultToastStyle,
    icon: '⚠',
    iconTheme: {
      primary: '#ff6b35',
      secondary: '#1a1a1a',
    },
  },

  // Info toasts - blue info icon
  info: {
    style: defaultToastStyle,
    icon: 'ℹ',
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#1a1a1a',
    },
  },
};

