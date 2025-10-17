import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Upload, AlertCircle } from 'lucide-react';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../common/Avatar';


const CreatePostModal = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { createPostWithFile } = usePostStore();
  const { user } = useAuthStore();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (40MB max)
      if (file.size > 40 * 1024 * 1024) {
        setError('File size must be less than 40MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Only images and videos are allowed');
        return;
      }

      setError('');
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      setError('Please add some content or media');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await createPostWithFile({
        content: content.trim(),
        file: mediaFile
      });
      onClose();
    } catch (error) {
      console.error('Create post error:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = mediaFile?.type?.startsWith('video/');

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Post" size="sm">
      <div className="space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <Avatar src={user.avatar} alt={user.name} size="sm" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Public</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          loading={loading}
          disabled={(!content.trim() && !mediaFile) || loading}
        >
          {loading ? "Posting..." : "Post"}
        </Button>

        {/* Content Input */}
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError("");
          }}
          placeholder="What's on your mind?"
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {isVideo ? (
              <video src={mediaPreview} controls className="w-full max-h-96" />
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-full max-h-96 object-contain"
              />
            )}
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* File Input (Hidden)
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,pdf/*,txt/*"
          onChange={handleFileSelect}
          className="hidden"
        /> */}

      
          

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,pdf/*,txt/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        

        {/* Media Buttons */}
        {!mediaFile && (
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <ImageIcon
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Add Photo
              </span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Video size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Add Video
              </span>
            </button>
          </div>
        )}

        {/* File Info */}
        {mediaFile && (
          <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p>
              <strong>File:</strong> {mediaFile.name}
            </p>
            <p>
              <strong>Size:</strong> {(mediaFile.size / 1024 / 1024).toFixed(2)}{" "}
              MB
            </p>
            <p>
              <strong>Type:</strong> {mediaFile.type}
            </p>
          </div>
        )}

       
      </div>
    </Modal>
  );
};

export default CreatePostModal;