import { useState } from 'react';
import { Upload, Button, Image, message } from 'antd';
import { UploadOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import * as mediaService from '../../services/mediaService';
import { toast } from 'react-toastify';
import MediaPicker from './MediaPicker';

/**
 * Image Upload Component
 * Handles single image upload with preview
 * 
 * @param {Object} props
 * @param {string} props.value - Current image object { url, publicId, width, height }
 * @param {Function} props.onChange - Callback when image changes (receives image object or null)
 * @param {string} props.folder - Folder path for upload (default: 'media')
 * @param {string} props.label - Label text
 * @param {string} props.accept - Accepted file types (default: 'image/*')
 * @param {number} props.maxSize - Max file size in MB (default: 10)
 * @param {Object} props.dimensions - Required dimensions { minWidth, minHeight, maxWidth, maxHeight }
 * @param {boolean} props.disabled - Whether upload is disabled
 * @param {boolean} props.showLibraryButton - Whether to show "Select from Library" button (default: true)
 */
const ImageUpload = ({
  value = null,
  onChange,
  folder = 'media',
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 10,
  dimensions = null,
  disabled = false,
  showLibraryButton = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleUpload = async (file) => {
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      message.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file');
      return false;
    }

    setUploading(true);
    try {
      const response = await mediaService.uploadMedia(file, {
        folder,
        altText: file.name,
      });

      if (response.success && response.data.media) {
        const uploadedMedia = Array.isArray(response.data.media)
          ? response.data.media[0]
          : response.data.media;

        const imageData = {
          url: uploadedMedia.url || uploadedMedia.secureUrl,
          publicId: uploadedMedia.publicId,
          width: uploadedMedia.width,
          height: uploadedMedia.height,
        };

        onChange?.(imageData);
        message.success('Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload
  };

  const handleRemove = () => {
    onChange?.(null);
    message.success('Image removed');
  };

  const handlePickerSelect = (selectedMedia) => {
    if (selectedMedia && selectedMedia.length > 0) {
      const media = selectedMedia[0]; // Single selection
      const imageData = {
        url: media.secureUrl || media.url,
        publicId: media.publicId,
        width: media.width,
        height: media.height,
        _id: media._id, // Include ID for reference
      };
      onChange?.(imageData);
      message.success('Image selected from library');
    }
  };

  const getSelectedMediaForPicker = () => {
    if (!value || !value._id) return [];
    return [value._id];
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    accept,
    disabled: disabled || uploading,
    maxCount: 1,
    multiple: false,
  };

  return (
    <div className="image-upload">
      {label && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {value?.url && (
          <div className="relative">
            <Image
              src={value.url}
              alt="Preview"
              width={200}
              height={120}
              className="object-cover rounded-lg border border-gray-200"
              preview={{
                visible: previewVisible,
                onVisibleChange: (visible) => setPreviewVisible(visible),
              }}
              onClick={() => setPreviewVisible(true)}
            />
            {!disabled && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-white shadow-md hover:bg-red-50"
                size="small"
              />
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={disabled || uploading}
              size="large"
            >
              {value?.url ? 'Change Image' : 'Upload Image'}
            </Button>
          </Upload>
          {showLibraryButton && (
            <Button
              icon={<FolderOutlined />}
              onClick={() => setPickerOpen(true)}
              disabled={disabled}
              size="large"
            >
              Select from Library
            </Button>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        multiple={false}
        folder={folder}
        selectedImages={getSelectedMediaForPicker()}
        resourceType="image"
      />

      {dimensions && (
        <p className="text-xs text-gray-500 mt-2">
          Recommended: {dimensions.minWidth}×{dimensions.minHeight}px
          {dimensions.maxWidth && dimensions.maxHeight && 
            ` (max: ${dimensions.maxWidth}×${dimensions.maxHeight}px)`
          }
        </p>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Max file size: {maxSize}MB
      </p>
    </div>
  );
};

export default ImageUpload;

