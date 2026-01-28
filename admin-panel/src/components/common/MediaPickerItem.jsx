import { useState } from 'react';
import { Image, Checkbox, Tooltip } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import './MediaPickerItem.css';

/**
 * MediaPickerItem Component
 * Individual image card in the media picker grid
 * 
 * @param {Object} props
 * @param {Object} props.media - Media object
 * @param {boolean} props.selected - Whether this item is selected
 * @param {Function} props.onSelect - Callback when item is clicked
 * @param {boolean} props.multiple - Whether multiple selection is allowed
 */
const MediaPickerItem = ({ media, selected, onSelect, multiple = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = (e) => {
    // Don't trigger selection if clicking on checkbox
    if (e.target.type === 'checkbox' || e.target.closest('.ant-checkbox')) {
      return;
    }
    onSelect?.(media);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelect?.(media);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const imageUrl = media.secureUrl || media.url;
  const displayName = media.filename || media.originalName || 'Untitled';

  return (
    <div
      className={`media-picker-item ${selected ? 'selected' : ''} ${imageError ? 'error' : ''}`}
      onClick={handleClick}
    >
      <div className="media-picker-item-thumbnail">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={displayName}
            preview={false}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={imageLoaded ? 'loaded' : 'loading'}
            placeholder={
              <div className="image-placeholder">
                <div className="spinner" />
              </div>
            }
          />
        ) : (
          <div className="image-error">
            <span>Failed to load</span>
          </div>
        )}
        
        {selected && (
          <div className="media-picker-item-selected-overlay">
            <CheckCircleOutlined className="selected-icon" />
          </div>
        )}
        
        {multiple && (
          <div className="media-picker-item-checkbox" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onChange={handleCheckboxChange}
            />
          </div>
        )}
      </div>
      
      <div className="media-picker-item-info">
        <Tooltip title={displayName}>
          <div className="media-picker-item-filename" title={displayName}>
            {displayName}
          </div>
        </Tooltip>
        <div className="media-picker-item-meta">
          {media.size && (
            <span className="file-size">{formatFileSize(media.size)}</span>
          )}
          {media.width && media.height && (
            <span className="dimensions">
              {media.width} × {media.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPickerItem;

