// frontend/components/common/VerifiedBadge.jsx

import React from 'react';
import { CheckCircle } from 'lucide-react';

const VerifiedBadge = ({ size = 16, className = "" }) => {
  return (
    <CheckCircle 
      size={size} 
      className={`text-gray-100 fill-green-700 inline-block ${className}`}
      title="Verified"
      aria-label="Verified account"
    />
  );
};

export default VerifiedBadge;

