// frontend/components/common/VerifiedBadge.jsx

import React from 'react';
import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 12, className = "" }) => {
  return (
    <BadgeCheck 
      size={size} 
      className={`text-gray-100 fill-yellow-300 inline-block ${className}`}
      title="Verified"
      aria-label="Verified account"
    />
  );
};

export default VerifiedBadge;

