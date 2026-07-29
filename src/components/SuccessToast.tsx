import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  duration = 2500,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose]);

  if (!visible) return null;

  return (
    <div className="success-toast" role="status" aria-live="polite">
      <CheckCircle size={22} aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        className="success-toast-close"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        aria-label="关闭提示"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default SuccessToast;
