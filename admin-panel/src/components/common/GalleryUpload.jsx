import { useState } from 'react';
import { Upload, Button, Image, message, Input } from 'antd';
import { UploadOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import * as mediaService from '../../services/mediaService';
import { toast } from 'react-toastify';
import MediaPicker from './MediaPicker';

/**
 * Gallery Upload Component
 * Handles multiple image uploads with preview and ordering
 * 
 * @param {Object} props
 * @param {Array} props.value - Current gallery array [{ url, publicId, width, height, altText, order }]
 * @param {Function} props.onChange - Callback when gallery changes (receives gallery array)
 * @param {string} props.folder - Folder path for upload (default: 'media')
 * @param {string} props.label - Label text
 * @param {number} props.maxSize - Max file size in MB (default: 10)
 * @param {Object} props.dimensions - Required dimensions { minWidth, minHeight }
 * @param {boolean} props.disabled - Whether upload is disabled
 * @param {boolean} props.showLibraryButton - Whether to show "Select from Library" button (default: true)
 */
const GalleryUpload = ({
  value = [],
  onChange,
  folder = 'media',
  label = 'Upload Gallery Images',
  maxSize = 10,
  dimensions = null,
  disabled = false,
  showLibraryButton = true,
}) => {
  const [uploading, setUploading] = useState(false);
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
          altText: uploadedMedia.altText || file.name,
          order: value.length,
        };

        const updatedGallery = [...value, imageData];
        onChange?.(updatedGallery);
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

  const handleRemove = (index) => {
    const updatedGallery = value.filter((_, i) => i !== index);
    // Reorder remaining images
    updatedGallery.forEach((img, i) => {
      img.order = i;
    });
    onChange?.(updatedGallery);
    message.success('Image removed');
  };

  const handleAltTextChange = (index, altText) => {
    const updatedGallery = [...value];
    updatedGallery[index] = { ...updatedGallery[index], altText };
    onChange?.(updatedGallery);
  };

  const handlePickerSelect = (selectedMedia) => {
    if (selectedMedia && selectedMedia.length > 0) {
      const newImages = selectedMedia.map((media, index) => ({
        url: media.secureUrl || media.url,
        publicId: media.publicId,
        width: media.width,
        height: media.height,
        altText: media.altText || media.filename || `Gallery image ${value.length + index + 1}`,
        order: value.length + index,
        _id: media._id, // Include ID for reference
      }));
      
      const updatedGallery = [...value, ...newImages];
      onChange?.(updatedGallery);
      message.success(`${selectedMedia.length} image(s) selected from library`);
    }
  };

  const getSelectedMediaForPicker = () => {
    return value
      .filter(img => img._id)
      .map(img => img._id);
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    accept: 'image/*',
    disabled: disabled || uploading,
    multiple: true,
  };

  return (
    <div className="gallery-upload">
      {label && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Upload Buttons */}
        <div className="flex gap-2">
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={disabled || uploading}
              size="large"
            >
              Upload Images
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

        {/* Gallery Preview */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((image, index) => (
              <div key={index} className="relative border border-gray-200 rounded-lg p-2 bg-white">
                <Image
                  src={image.url}
                  alt={image.altText || `Gallery image ${index + 1}`}
                  className="object-cover rounded"
                  width="100%"
                  height={150}
                />
                {!disabled && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(index)}
                    className="absolute top-2 right-2 bg-white shadow-md hover:bg-red-50"
                    size="small"
                  />
                )}
                <div className="mt-2">
                  <Input
                    placeholder="Alt text"
                    value={image.altText || ''}
                    onChange={(e) => handleAltTextChange(index, e.target.value)}
                    disabled={disabled}
                    size="small"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dimensions && (
        <p className="text-xs text-gray-500 mt-2">
          Recommended: {dimensions.minWidth}×{dimensions.minHeight}px
        </p>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Max file size: {maxSize}MB per image
      </p>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        multiple={true}
        folder={folder}
        selectedImages={getSelectedMediaForPicker()}
        resourceType="image"
      />
    </div>
  );
};

export default GalleryUpload;

