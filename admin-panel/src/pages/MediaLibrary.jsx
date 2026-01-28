import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, PictureOutlined } from '@ant-design/icons';
import * as mediaLibraryService from '../services/mediaLibraryService';

const { Option } = Select;
const { Search } = Input;

const MediaLibrary = () => {
  const navigate = useNavigate();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    resourceType: '',
    folder: '',
  });
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    fetchMedia();
    fetchFolders();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };
      const response = await mediaLibraryService.getAllMedia(params);
      if (response.success) {
        setMedia(response.data.media || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('Failed to fetch media');
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await mediaLibraryService.getFolders();
      if (response.success) {
        setFolders(response.data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await mediaLibraryService.deleteMedia(id);
      if (response.success) {
        message.success('Media deleted successfully');
        fetchMedia();
      }
    } catch (error) {
      message.error('Failed to delete media');
    }
  };

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'url',
      key: 'preview',
      width: 100,
      render: (url, record) => {
        if (record.youtubeId) {
          return (
            <img
              src={record.youtubeThumbnail || `https://img.youtube.com/vi/${record.youtubeId}/hqdefault.jpg`}
              alt={record.filename}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
            />
          );
        }
        if (record.resourceType === 'image') {
          return (
            <img
              src={url}
              alt={record.filename}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
            />
          );
        }
        return <PictureOutlined style={{ fontSize: 40, color: '#ccc' }} />;
      },
    },
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 100,
      render: (type, record) => {
        if (record.youtubeId) {
          return <Tag color="red">YouTube</Tag>;
        }
        return <Tag>{type || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Folder',
      dataIndex: 'folder',
      key: 'folder',
      width: 150,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => {
        if (!size) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return `${(size / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/media-library/${record._id}`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Media Library</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/media-library/new')}
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
            }}
          >
            Add Media
          </Button>
        </div>

        <Space direction="vertical" className="w-full mb-4">
          <div className="flex gap-4 flex-wrap">
            <Search
              placeholder="Search by filename, description..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
            />
            <Select
              placeholder="Filter by type"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setFilters(prev => ({ ...prev, resourceType: value }))}
            >
              <Option value="image">Image</Option>
              <Option value="video">Video</Option>
              <Option value="youtube">YouTube</Option>
              <Option value="raw">Raw</Option>
            </Select>
            <Select
              placeholder="Filter by folder"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters(prev => ({ ...prev, folder: value }))}
            >
              {folders.map(folder => (
                <Option key={folder} value={folder}>{folder}</Option>
              ))}
            </Select>
          </div>
        </Space>

        <Table
          columns={columns}
          dataSource={media}
          loading={loading}
          rowKey="_id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default MediaLibrary;
