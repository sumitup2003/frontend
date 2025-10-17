import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VerificationRequest = ({ onBack, user }) => {
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    reason: '',
    category: '',
    socialLinks: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    'Content Creator',
    'Artist/Musician',
    'Public Figure',
    'Business/Brand',
    'Journalist/News',
    'Developer/Tech',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const url = `${API_BASE_URL}/verification/request`;
      console.log('📡 Submitting to:', url);
      console.log('🔑 Using token:', token ? 'Token present' : 'No token');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Add Bearer token
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Request Submitted!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Your verification request has been submitted successfully.
            You'll be notified once it's reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      

      <div className="mb-6">
        <button
        onClick={onBack}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>
        <h3 className="text-lg font-semibold text-yellow-400 dark:text-yellow-400 mb-2">
          Get Verified
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The verified badge helps people know that your account is authentic. 
          Please provide the information below to request verification.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your full name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for Verification *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Explain why you should be verified (e.g., public figure, content creator, professional)"
            required
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* <Input
          label="Social Media Links (Optional)"
          name="socialLinks"
          value={formData.socialLinks}
          onChange={handleChange}
          placeholder="Twitter, Instagram, LinkedIn, etc."
        /> */}

        <div>
          {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Information (Optional)
          </label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            placeholder="Any other information that might help with your verification"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          /> */}
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VerificationRequest;