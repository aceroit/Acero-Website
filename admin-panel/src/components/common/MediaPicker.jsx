import { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Input, Select, Button, Checkbox, Space, Upload, message, Spin, Empty } from 'antd';
import { SearchOutlined, UploadOutlined, ClearOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import * as mediaService from '../../services/mediaService';
import MediaPickerItem from './MediaPickerItem';
import { toast } from 'react-toastify';
import './MediaPicker.css';

const { Option } = Select;

/**
 * MediaPicker Component
 * Modal dialog for selecting media from Cloudinary library
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSelect - Callback when images are selected (receives array of media objects)
 * @param {boolean} props.multiple - Whether multiple selection is allowed
 * @param {string} props.folder - Optional folder filter (e.g., "projects/thumbnails")
 * @param {Array} props.selectedImages - Pre-selected images (array of media objects or IDs)
 * @param {string} props.resourceType - Filter by resource type ('image', 'video', 'all')
 */
const MediaPicker = ({
  open,
  onClose,
  onSelect,
  multiple = false,
  folder = null,
  selectedImages = [],
  resourceType = 'image'
}) => {
  const [activeTab, setActiveTab] = useState('select');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [uploadFolder, setUploadFolder] = useState(folder || 'media');

  const limit = 20; // Items per page

  // Initialize selected IDs from props
  useEffect(() => {
    if (selectedImages && selectedImages.length > 0) {
      const ids = selectedImages.map(img => 
        typeof img === 'string' ? img : (img._id || img.id)
      );
      setSelectedIds(new Set(ids));
    } else {
      setSelectedIds(new Set());
    }
  }, [selectedImages, open]);

  // Reset folder when prop changes
  useEffect(() => {
    if (folder) {
      setUploadFolder(folder);
    }
  }, [folder]);

  // Fetch media
  const fetchMedia = useCallback(async (page = 1, search = '', sort = 'newest') => {
    setLoading(true);
    try {
      let response;
      const params = {
        page,
        limit,
        resourceType: resourceType !== 'all' ? resourceType : undefined,
        sortBy: sort === 'newest' ? 'createdAt' : sort === 'oldest' ? 'createdAt' : 'filename',
        sortOrder: sort === 'newest' ? 'desc' : sort === 'oldest' ? 'asc' : sort === 'name-asc' ? 'asc' : 'desc'
      };

      if (search) {
        // Use search endpoint
        response = await mediaService.searchMedia({
          query: search,
          folder: folder || undefined,
          resourceType: resourceType !== 'all' ? resourceType : undefined,
          page,
          limit
        });
      } else if (folder) {
        // Use folder endpoint
        response = await mediaService.getMediaByFolder(folder, params);
      } else {
        // Use general endpoint
        params.folder = folder || undefined;
        response = await mediaService.getAllMedia(params);
      }

      if (response.success) {
        // Handle paginated response structure
        const mediaData = response.data?.data || response.data || [];
        const totalCount = response.data?.pagination?.total || response.data?.total || mediaData.length;
        
        setMedia(mediaData);
        setTotal(totalCount);
        setCurrentPage(page);
      } else {
        throw new Error(response.message || 'Failed to fetch media');
      }
    } catch (error) {
      console.error('Fetch media error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch media');
      setMedia([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [folder, resourceType, limit]);

  // Initial load and when dependencies change
  useEffect(() => {
    if (open) {
      fetchMedia(1, searchQuery, sortBy);
    }
  }, [open, folder, resourceType]);

  // Handle search
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchMedia(1, value, sortBy);
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    fetchMedia(1, searchQuery, value);
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    const newSelectedIds = new Set(selectedIds);
    
    if (newSelectedIds.has(item._id)) {
      newSelectedIds.delete(item._id);
    } else {
      if (!multiple) {
        newSelectedIds.clear();
      }
      newSelectedIds.add(item._id);
    }
    
    setSelectedIds(newSelectedIds);
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedIds(new Set());
  };

  // Handle add files
  const handleAddFiles = () => {
    const selectedMedia = media.filter(item => selectedIds.has(item._id));
    if (selectedMedia.length === 0) {
      message.warning('Please select at least one file');
      return;
    }
    onSelect?.(selectedMedia);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setShowSelectedOnly(false);
    onClose?.();
  };

  // Handle upload
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const response = await mediaService.uploadMedia(file, {
        folder: uploadFolder,
        altText: file.name
      });

      if (response.success && response.data.media) {
        const uploadedMedia = Array.isArray(response.data.media)
          ? response.data.media[0]
          : response.data.media;
        
        message.success('File uploaded successfully');
        
        // Refresh media list
        await fetchMedia(currentPage, searchQuery, sortBy);
        
        // Auto-select uploaded file
        if (uploadedMedia._id) {
          const newSelectedIds = new Set(selectedIds);
          if (!multiple) {
            newSelectedIds.clear();
          }
          newSelectedIds.add(uploadedMedia._id);
          setSelectedIds(newSelectedIds);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  // Filter displayed media
  const displayedMedia = showSelectedOnly
    ? media.filter(item => selectedIds.has(item._id))
    : media;

  const totalPages = Math.ceil(total / limit);
  const selectedCount = selectedIds.size;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={900}
      className="media-picker-modal"
      footer={null}
      style={{ top: 20 }}
      title={
        <div className="media-picker-header">
          <span>Select File</span>
          <span className="media-picker-header-upload">Upload New</span>
        </div>
      }
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        className="media-picker-tabs"
        items={[
          {
            key: 'select',
            label: 'Select File',
            children: (
              <>
          <div className="media-picker-content">
            {/* Controls */}
            <div className="media-picker-controls">
              <div className="media-picker-controls-left">
                <Input
                  placeholder="Search your files"
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                  className="media-picker-search"
                />
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="media-picker-sort"
                  style={{ width: 150 }}
                >
                  <Option value="newest">Sort by newest</Option>
                  <Option value="oldest">Sort by oldest</Option>
                  <Option value="name-asc">Name A-Z</Option>
                  <Option value="name-desc">Name Z-A</Option>
                </Select>
                {multiple && (
                  <Checkbox
                    checked={showSelectedOnly}
                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                  >
                    Selected Only
                  </Checkbox>
                )}
              </div>
            </div>

            {/* Media Grid */}
            <div className="media-picker-grid-container">
              {loading ? (
                <div className="media-picker-loading">
                  <Spin size="large" />
                </div>
              ) : displayedMedia.length === 0 ? (
                <Empty description="No media found" />
              ) : (
                <div className="media-picker-grid">
                  {displayedMedia.map((item) => (
                    <MediaPickerItem
                      key={item._id}
                      media={item}
                      selected={selectedIds.has(item._id)}
                      onSelect={handleItemSelect}
                      multiple={multiple}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="media-picker-pagination">
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => fetchMedia(currentPage - 1, searchQuery, sortBy)}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>
                <span className="media-picker-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => fetchMedia(currentPage + 1, searchQuery, sortBy)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="media-picker-footer">
              <div className="media-picker-footer-left">
                <span>{selectedCount} File{selectedCount !== 1 ? 's' : ''} selected</span>
                {selectedCount > 0 && (
                  <Button
                    type="link"
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    size="small"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="media-picker-footer-right">
                <Button onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleAddFiles}
                  disabled={selectedCount === 0}
                >
                  Add Files
                </Button>
              </div>
            </div>
          </div>
              </>
            )
          },
          {
            key: 'upload',
            label: 'Upload New',
            children: (
              <>
          <div className="media-picker-upload">
            <div className="media-picker-upload-folder">
              <label>Upload to folder:</label>
              <Input
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="e.g., projects/thumbnails"
              />
            </div>
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              accept="image/*"
              multiple={multiple}
              disabled={uploading}
            >
              <div className="media-picker-upload-area">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <p>Click or drag files to upload</p>
                <p className="upload-hint">Supports single or multiple file upload</p>
              </div>
            </Upload>
            {uploading && (
              <div className="media-picker-upload-progress">
                <Spin /> <span>Uploading...</span>
              </div>
            )}
          </div>
              </>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default MediaPicker;

