import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Input, 
  Card, 
  Tag, 
  Space, 
  Dropdown, 
  Switch,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { ROLES } from '../utils/constants';
import * as sectionTypeService from '../services/sectionTypeService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;

const SectionTypes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  
  const [sectionTypes, setSectionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSectionType, setSelectedSectionType] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  // Fetch section types
  const fetchSectionTypes = async () => {
    setLoading(true);
    try {
      const response = await sectionTypeService.getAllSectionTypes(true); // Include inactive
      if (response.success) {
        // Flatten grouped object to array
        let types = response.data.sectionTypes || response.data || [];
        if (types && typeof types === 'object' && !Array.isArray(types)) {
          types = Object.values(types).flat();
        }
        setSectionTypes(Array.isArray(types) ? types : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch section types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionTypes();
  }, []);

  // Handle delete section type
  const handleDelete = async () => {
    if (!selectedSectionType) return;
    
    try {
      const response = await sectionTypeService.deleteSectionType(selectedSectionType.slug);
      if (response.success) {
        toast.success('Section type deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedSectionType(null);
        fetchSectionTypes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete section type');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Show toast instead of navigating to create section type
  const handleCreateSectionTypeClick = () => {
    toast.info('To add new section types, please contact the developer team.');
  };

  // Filter section types based on search
  const filteredSectionTypes = sectionTypes.filter((st) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      st.name?.toLowerCase().includes(searchLower) ||
      st.slug?.toLowerCase().includes(searchLower) ||
      st.category?.toLowerCase().includes(searchLower) ||
      st.description?.toLowerCase().includes(searchLower)
    );
  });

  // Table columns
  const columns = [
    {
      title: 'Name',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <SettingOutlined className="text-xs md:text-base" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm md:text-base truncate">{record.name}</span>
              {record.isSystem && (
                <Tag color="red" className="text-xs flex-shrink-0">System</Tag>
              )}
              {!record.isActive && (
                <Tag color="default" className="text-xs flex-shrink-0">Inactive</Tag>
              )}
            </div>
            <span className="text-xs text-gray-500 font-mono truncate">{record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      responsive: ['md'],
      render: (category) => (
        <Tag color="blue" className="px-2 md:px-3 py-1 text-xs md:text-sm">
          {category || 'General'}
        </Tag>
      ),
    },
    {
      title: 'Fields',
      key: 'fields',
      width: 80,
      render: (_, record) => (
        <Badge 
          count={record.fields?.length || 0} 
          showZero
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['lg'],
      render: (desc) => (
        <span className="text-gray-600 text-xs md:text-sm">
          {desc ? (desc.length > 50 ? `${desc.substring(0, 50)}...` : desc) : '—'}
        </span>
      ),
      ellipsis: true,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag 
          color={record.isActive ? 'green' : 'default'}
          className="px-2 md:px-3 py-1 font-semibold text-xs md:text-sm"
        >
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      responsive: ['md'],
      render: (date) => (
        <span className="text-gray-600 text-xs md:text-sm">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        if (!isSuperAdmin) return <span className="text-gray-400">—</span>;
        
        const menuItems = [];
        
        menuItems.push({
          key: 'edit',
          label: 'Edit',
          icon: <EditOutlined />,
          onClick: () => {
            navigate(`/section-types/${record.slug}`);
          },
        });

        if (!record.isSystem) {
          menuItems.push({
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              setSelectedSectionType(record);
              setIsDeleteModalOpen(true);
            },
          });
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="hover:bg-gray-100"
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">
              Access Denied
            </p>
            <p className="text-gray-500">
              Only Super Administrators can manage section types.
            </p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Section Types
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage custom section types and their field configurations
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateSectionTypeClick}
            className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              height: '44px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Create Section Type
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <Search
            placeholder="Search section types by name, slug, category, or description..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch('');
              }
            }}
            className="w-full"
          />
        </Card>

        {/* Section Types Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          styles={{ body: { padding: 0 } }}
        >
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredSectionTypes}
              loading={loading}
              rowKey="slug"
              className="custom-table section-types-table"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} section types`,
                pageSizeOptions: ['10', '20', '50', '100'],
                responsive: true,
              }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
              locale={{
                emptyText: (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 mb-4">No section types found</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateSectionTypeClick}
                      style={{
                        backgroundColor: '#1f2937',
                        borderColor: '#1f2937',
                      }}
                    >
                      Create First Section Type
                    </Button>
                  </div>
                ),
              }}
            />
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Section Type"
          content={
            <div>
              <p className="mb-2">
                Are you sure you want to delete "{selectedSectionType?.name}"?
              </p>
              <p className="text-red-600 text-sm">
                This action cannot be undone. All sections using this type will need to be updated or removed.
              </p>
            </div>
          }
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedSectionType(null);
          }}
          okText="Delete"
          okButtonProps={{ danger: true }}
        />
      </div>
    </MainLayout>
  );
};

export default SectionTypes;

