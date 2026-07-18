import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessToastProps {
  message: string;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message }) => (
  <div className="success-toast" role="status" aria-live="polite">
    <CheckCircle size={22} aria-hidden="true" />
    <span>{message}</span>
  </div>
);

export default SuccessToast;
