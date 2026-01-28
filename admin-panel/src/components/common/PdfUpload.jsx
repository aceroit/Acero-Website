import { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as mediaService from '../../services/mediaService';
import { toast } from 'react-toastify';

/**
 * PDF Upload Component – uploads PDF to Cloudinary (raw) and returns file URL.
 * Used for brochure language PDFs and other document fields.
 *
 * @param {Object} props
 * @param {string} props.value - Current file URL (string)
 * @param {Function} props.onChange - Callback when file changes (receives url string or null)
 * @param {string} props.folder - Cloudinary folder (default: 'brochures/pdfs')
 * @param {string} props.label - Label text
 * @param {number} props.maxSize - Max file size in MB (default: 20)
 * @param {boolean} props.disabled - Whether upload is disabled
 */
const PdfUpload = ({
  value = null,
  onChange,
  folder = 'brochures/pdfs',
  label = 'Upload PDF',
  maxSize = 20,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    const fileExt = (file.name || '').split('.').pop().toLowerCase();
    if (fileExt !== 'pdf') {
      message.error('Please upload a PDF file');
      return false;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      message.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    setUploading(true);
    try {
      const response = await mediaService.uploadMedia(file, { folder });
      if (response?.success && response?.data?.media) {
        const media = Array.isArray(response.data.media)
          ? response.data.media[0]
          : response.data.media;
        const url = media.secureUrl || media.url;
        onChange?.(url);
        message.success('PDF uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
    return false; // prevent default upload
  };

  const handleRemove = () => {
    onChange?.(null);
    message.success('PDF removed');
  };

  return (
    <div className="pdf-upload">
      {label && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {value ? (
          <>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FilePdfOutlined /> View / Download PDF
            </a>
            {!disabled && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                size="small"
              >
                Remove
              </Button>
            )}
          </>
        ) : null}
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept=".pdf,application/pdf"
          disabled={disabled || uploading}
          maxCount={1}
        >
          <Button
            type="default"
            icon={<UploadOutlined />}
            loading={uploading}
            disabled={disabled || uploading}
            size="large"
          >
            {value ? 'Replace PDF' : 'Upload PDF'}
          </Button>
        </Upload>
      </div>
      <p className="text-xs text-gray-500 mt-1">PDF only, max {maxSize}MB</p>
    </div>
  );
};

export default PdfUpload;
