import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useStoryStore } from '../../store/storyStore';
import Modal from '../common/Modal';
import Button from '../common/Button';

const CreateStoryModal = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { createStory } = useStoryStore();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a photo or video');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createStory(file, caption);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Story" size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            {isVideo ? (
              <video src={preview} controls className="w-full rounded-lg max-h-96" />
            ) : (
              <img src={preview} alt="Preview" className="w-full rounded-lg max-h-96 object-cover" />
            )}
            <button
              onClick={() => {
                setFile(null);
                setPreview('');
              }}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <Upload size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Click to upload photo or video</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Max 10MB</p>
          </button>
        )}

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption... (optional)"
          maxLength={200}
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {caption.length}/200
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            disabled={!file || loading}
          >
            Share Story
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Your story will be visible for 24 hours
        </p>
      </div>
    </Modal>
  );
};

export default CreateStoryModal;