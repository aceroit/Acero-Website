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
  Badge,
  Modal,
  Tree,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  FileTextOutlined,
  BranchesOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import ResourceForm from '../components/forms/ResourceForm';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { ROLES } from '../utils/constants';
import * as resourceService from '../services/resourceService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { TabPane } = Tabs;

const Resources = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  
  const [resources, setResources] = useState([]);
  const [resourceTree, setResourceTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'

  // Check if user is super admin
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  // Fetch resources
  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await resourceService.getAllResources(true); // Include inactive
      if (response.success) {
        const resourcesData = response.data.resources || response.data || [];
        setResources(Array.isArray(resourcesData) ? resourcesData : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  // Fetch resource tree
  const fetchResourceTree = async () => {
    try {
      const response = await resourceService.getResourceTree();
      if (response.success) {
        const treeData = response.data.tree || response.data || [];
        setResourceTree(Array.isArray(treeData) ? treeData : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch resource tree');
    }
  };

  useEffect(() => {
    fetchResources();
    fetchResourceTree();
  }, []);

  // Handle create resource
  const handleCreate = async (values) => {
    try {
      const response = await resourceService.createResource(values);
      if (response.success) {
        toast.success('Resource created successfully');
        setIsCreateModalOpen(false);
        fetchResources();
        fetchResourceTree();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create resource');
      throw error;
    }
  };

  // Handle update resource
  const handleUpdate = async (values) => {
    if (!selectedResource) return;
    
    try {
      const response = await resourceService.updateResource(selectedResource._id, values);
      if (response.success) {
        toast.success('Resource updated successfully');
        setIsEditModalOpen(false);
        setSelectedResource(null);
        fetchResources();
        fetchResourceTree();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update resource');
      throw error;
    }
  };

  // Handle delete resource
  const handleDelete = async () => {
    if (!selectedResource) return;
    
    try {
      const response = await resourceService.deleteResource(selectedResource._id);
      if (response.success) {
        toast.success('Resource deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedResource(null);
        fetchResources();
        fetchResourceTree();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete resource');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Filter resources based on search
  const filteredResources = resources.filter((resource) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      resource.name?.toLowerCase().includes(searchLower) ||
      resource.slug?.toLowerCase().includes(searchLower) ||
      resource.path?.toLowerCase().includes(searchLower) ||
      resource.category?.toLowerCase().includes(searchLower) ||
      resource.description?.toLowerCase().includes(searchLower)
    );
  });

  // Convert tree data for Ant Design Tree component
  const convertToTreeData = (treeArray) => {
    return treeArray.map((node) => ({
      title: (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.name}</span>
            <Tag color="blue" className="text-xs">{node.slug}</Tag>
            {!node.isActive && <Tag color="default" className="text-xs">Inactive</Tag>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{node.path}</span>
            {isSuperAdmin && (
              <Space>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResource(node);
                    setIsEditModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResource(node);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  Delete
                </Button>
              </Space>
            )}
          </div>
        </div>
      ),
      key: node._id,
      children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined,
    }));
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <FileTextOutlined className="text-xs md:text-base" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm md:text-base truncate">{record.name}</span>
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
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      width: 150,
      responsive: ['md'],
      render: (path) => (
        <span className="text-gray-600 text-xs md:text-sm font-mono">{path}</span>
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
      title: 'Parent',
      key: 'parent',
      width: 120,
      responsive: ['lg'],
      render: (_, record) => {
        const parent = resources.find(r => r._id === record.parentId);
        return parent ? (
          <span className="text-gray-600 text-xs md:text-sm">{parent.name}</span>
        ) : (
          <span className="text-gray-400 text-xs md:text-sm">—</span>
        );
      },
    },
    {
      title: 'Menu',
      key: 'showInMenu',
      width: 80,
      render: (_, record) => (
        <Tag color={record.showInMenu ? 'green' : 'default'} className="px-2 md:px-3 py-1 text-xs md:text-sm">
          {record.showInMenu ? 'Yes' : 'No'}
        </Tag>
      ),
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
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      responsive: ['lg'],
      render: (order) => (
        <span className="text-gray-600 text-xs md:text-sm">{order || 0}</span>
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
        
        const menuItems = [
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => {
              setSelectedResource(record);
              setIsEditModalOpen(true);
            },
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              setSelectedResource(record);
              setIsDeleteModalOpen(true);
            },
          },
        ];

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
              Only Super Administrators can manage resources.
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
              Resources
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage dynamic resources and their permissions
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              height: '44px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Create Resource
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <Search
            placeholder="Search resources by name, slug, path, category, or description..."
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

        {/* Resources Table/Tree */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          styles={{ body: { padding: 0 } }}
        >
          <Tabs
            activeKey={viewMode}
            onChange={setViewMode}
            style={{ padding: '0 16px', paddingTop: '16px' }}
          >
            <TabPane 
              tab={
                <span>
                  <UnorderedListOutlined />
                  List View
                </span>
              } 
              key="list"
            >
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={filteredResources}
                  loading={loading}
                  rowKey="_id"
                  className="custom-table resources-table"
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} resources`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    responsive: true,
                  }}
                  scroll={{ x: 1000, y: 'calc(100vh - 340px)' }}
                  locale={{
                    emptyText: (
                      <div className="py-12 text-center">
                        <p className="text-gray-500 mb-4">No resources found</p>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setIsCreateModalOpen(true)}
                          style={{
                            backgroundColor: '#1f2937',
                            borderColor: '#1f2937',
                          }}
                        >
                          Create First Resource
                        </Button>
                      </div>
                    ),
                  }}
                />
              </div>
            </TabPane>
            <TabPane 
              tab={
                <span>
                  <BranchesOutlined />
                  Tree View
                </span>
              } 
              key="tree"
            >
              <div className="p-4">
                {resourceTree.length > 0 ? (
                  <Tree
                    treeData={convertToTreeData(resourceTree)}
                    defaultExpandAll
                    showLine={{ showLeafIcon: false }}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 mb-4">No resources found</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsCreateModalOpen(true)}
                      style={{
                        backgroundColor: '#1f2937',
                        borderColor: '#1f2937',
                      }}
                    >
                      Create First Resource
                    </Button>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>

        {/* Create Resource Modal */}
        <Modal
          title="Create Resource"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          width={700}
        >
          <ResourceForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={loading}
            isEdit={false}
          />
        </Modal>

        {/* Edit Resource Modal */}
        <Modal
          title="Edit Resource"
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedResource(null);
          }}
          footer={null}
          width={700}
        >
          <ResourceForm
            initialValues={selectedResource}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedResource(null);
            }}
            loading={loading}
            isEdit={true}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Resource"
          content={
            <div>
              <p className="mb-2">
                Are you sure you want to delete "{selectedResource?.name}"?
              </p>
              <p className="text-red-600 text-sm">
                This action cannot be undone. All permissions associated with this resource will be removed.
              </p>
            </div>
          }
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedResource(null);
          }}
          okText="Delete"
          okButtonProps={{ danger: true }}
        />
      </div>
    </MainLayout>
  );
};

export default Resources;

