import React from 'react';
import { RegistrationStatusType } from './registration.types';

interface RegistrationStatusProps {
  status: RegistrationStatusType;
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusProps> = ({ status }) => {
  const getBadgeStyle = (): { label: string; className: string } => {
    switch (status) {
      case 'DRAFT':
        return { label: '草稿', className: 'status-draft' };
      case 'SUBMITTED':
        return { label: '已提交 (待审核)', className: 'status-submitted' };
      case 'CHANGES_REQUESTED':
        return { label: '退回修改', className: 'status-changes-requested' };
      case 'APPROVED':
        return { label: '审核通过', className: 'status-approved' };
      default:
        return { label: status, className: 'status-default' };
    }
  };

  const { label, className } = getBadgeStyle();

  return <span className={`registration-status-badge ${className}`}>{label}</span>;
};
