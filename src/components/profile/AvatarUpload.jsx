import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Modal from '../common/Modal';

const AvatarUpload = ({ currentAvatar, userName, onUploadSuccess, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Only images are allowed');
        return;
      }

      setError('');
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar');
      }

      if (data.success) {
        onUploadSuccess(data.data.avatar);
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Profile Picture" size="sm">
      <div className="space-y-4">
        {/* Current/Preview Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar 
              src={preview || currentAvatar} 
              alt={userName} 
              size="2xl" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* File Info */}
        {selectedFile && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Selected:</strong> {selectedFile.name}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload size={18} className="mr-2" />
            Choose Photo
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleUpload}
            loading={loading}
            disabled={!selectedFile || loading}
          >
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarUpload;