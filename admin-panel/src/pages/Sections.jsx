import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Card, 
  Tag, 
  Space, 
  Dropdown, 
  Tooltip,
  Switch,
  Popconfirm,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as sectionService from '../services/sectionService';
import * as pageService from '../services/pageService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

// Visibility Switch Component (can use hooks)
const VisibilitySwitch = ({ record, onToggle }) => {
  const workflowStatus = useWorkflowStatus({
    status: record.status,
    resourceType: 'section',
    createdBy: record.createdBy
  });

  // Disable toggle if section is in restricted status and user can't edit
  const restrictedStatuses = ['in_review', 'pending_approval', 'pending_publish'];
  const isRestricted = restrictedStatuses.includes(record.status);
  const isDisabled = isRestricted && !workflowStatus.canEdit.canEdit;

  return (
    <Tooltip 
      title={isDisabled ? (workflowStatus.canEdit.reason || 'Cannot toggle visibility in this status') : ''}
    >
      <Switch
        checked={record.isVisible}
        checkedChildren={<EyeOutlined />}
        unCheckedChildren={<EyeInvisibleOutlined />}
        disabled={isDisabled}
        onChange={() => onToggle(record._id, record.isVisible, record.status, record.createdBy)}
        onClick={(e) => e.stopPropagation()}
      />
    </Tooltip>
  );
};

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    in_review: 'blue',
    changes_requested: 'orange',
    pending_approval: 'purple',
    pending_publish: 'cyan',
    published: 'green',
    archived: 'red',
  };
  return colors[status] || 'default';
};

// Status display names
const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    pending_approval: 'Pending Approval',
    pending_publish: 'Pending Publish',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status] || status;
};

// Row actions with workflow-based visibility (Edit/Delete only when allowed by status + permission)
const SectionRowActions = ({ record, pageId, onNavigate, onDuplicate, onDelete, hasPermission }) => {
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'section',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('sections', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onNavigate(`/pages/${pageId}/sections/${record._id}`),
    });
  }
  if (hasPermission('sections', 'create')) {
    menuItems.push({
      key: 'duplicate',
      label: 'Duplicate',
      icon: <CopyOutlined />,
      onClick: () => onDuplicate(record._id),
    });
  }
  if (hasPermission('sections', 'delete') && workflowStatus.canDelete.canDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record._id),
    });
  }
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} className="hover:bg-gray-100" />
      </Dropdown>
    </div>
  );
};

const Sections = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  
  const [sections, setSections] = useState([]);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Fetch sections for the page
  const fetchSections = async () => {
    if (!pageId) return;
    
    setLoading(true);
    try {
      // Fetch page info
      const pageResponse = await pageService.getPageById(pageId);
      if (pageResponse.success) {
        setPage(pageResponse.data.page);
      }

      // Fetch sections (include hidden sections for admin panel)
      const response = await sectionService.getPageSections(pageId, true);
      if (response.success) {
        // Sort by order
        const sortedSections = (response.data.sections || response.data || []).sort(
          (a, b) => a.order - b.order
        );
        setSections(sortedSections);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [pageId]);

  // Handle delete section
  const handleDelete = async (sectionId) => {
    try {
      const response = await sectionService.deleteSection(sectionId);
      if (response.success) {
        toast.success('Section deleted successfully');
        fetchSections();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  };

  // Handle duplicate section
  const handleDuplicate = async (sectionId) => {
    try {
      const response = await sectionService.duplicateSection(sectionId);
      if (response.success) {
        toast.success('Section duplicated successfully');
        fetchSections();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to duplicate section');
    }
  };

  // Handle toggle visibility (VisibilitySwitch already disables when user cannot edit; backend validates)
  const handleToggleVisibility = async (sectionId, currentVisibility, sectionStatus, sectionCreatedBy) => {
    try {
      const response = await sectionService.toggleVisibility(sectionId);
      if (response.success) {
        toast.success(
          response.data.section.isVisible 
            ? 'Section is now visible' 
            : 'Section is now hidden'
        );
        fetchSections();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to toggle visibility';
      toast.error(errorMessage);
    }
  };

  // Handle reorder sections
  const handleReorder = async (sectionId, direction) => {
    if (reordering) return;
    
    setReordering(true);
    try {
      const sectionIndex = sections.findIndex(s => s._id === sectionId);
      if (sectionIndex === -1) {
        setReordering(false);
        return;
      }

      const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      if (newIndex < 0 || newIndex >= sections.length) {
        setReordering(false);
        return;
      }

      // Create a new array with sections swapped
      const updatedSections = [...sections];
      // Swap the sections in the array
      [updatedSections[sectionIndex], updatedSections[newIndex]] = 
        [updatedSections[newIndex], updatedSections[sectionIndex]];

      // Assign new sequential orders based on their new positions
      const reorderList = updatedSections.map((s, idx) => ({
        sectionId: s._id,
        order: idx,
      }));

      const response = await sectionService.reorderSections(reorderList);
      if (response.success) {
        toast.success('Sections reordered successfully');
        // Update local state immediately for better UX
        setSections(updatedSections);
        // Also fetch from server to ensure sync
        fetchSections();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reorder sections');
    } finally {
      setReordering(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Order',
      key: 'order',
      width: 80,
      render: (_, record, index) => (
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-600 font-semibold">{record.order}</span>
          <Space size={4}>
            <Tooltip title="Move Up">
              <Button
                type="text"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={index === 0 || reordering}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(record._id, 'up');
                }}
              />
            </Tooltip>
            <Tooltip title="Move Down">
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === sections.length - 1 || reordering}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(record._id, 'down');
                }}
              />
            </Tooltip>
          </Space>
        </div>
      ),
    },
    {
      title: 'Section Type',
      key: 'sectionTypeSlug',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Tag color="blue" className="px-3 py-1 font-semibold">
            {record.sectionTypeSlug}
          </Tag>
          {!record.isVisible && (
            <Tag color="default" className="px-2 py-1">
              Hidden
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Content Preview',
      key: 'content',
      render: (_, record) => {
        const content = record.content || {};
        // Get first text field value as preview
        const preview = Object.values(content).find(
          (val) => typeof val === 'string' && val.length > 0
        ) || 'No content';
        
        return (
          <div className="max-w-md">
            <span className="text-gray-700 text-sm">
              {typeof preview === 'string' && preview.length > 100
                ? `${preview.substring(0, 100)}...`
                : preview}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={getStatusColor(status)}
          className="px-3 py-1 font-semibold rounded-full"
        >
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Visibility',
      key: 'isVisible',
      width: 100,
      render: (_, record) => (
        <VisibilitySwitch record={record} onToggle={handleToggleVisibility} />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="text-gray-600 text-sm">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <SectionRowActions
          record={record}
          pageId={pageId}
          onNavigate={(path) => navigate(path)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          hasPermission={hasPermission}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/pages')}
              size="large"
            >
              Back to Pages
            </Button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                Sections
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                {page ? `Manage sections for "${page.title}"` : 'Manage page sections'}
              </p>
            </div>
          </div>
          <PermissionWrapper resource="sections" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate(`/pages/${pageId}/sections/new`)}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Add Section
            </Button>
          </PermissionWrapper>
        </div>

        {/* Sections Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={sections}
            loading={loading}
            rowKey="_id"
            className="custom-table sections-table"
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => {
                if (hasPermission('sections', 'update')) {
                  navigate(`/pages/${pageId}/sections/${record._id}`);
                }
              },
              className: hasPermission('sections', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <p className="text-gray-500 mb-4">No sections found</p>
                  {hasPermission('sections', 'create') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate(`/pages/${pageId}/sections/new`)}
                      style={{
                        backgroundColor: '#1f2937',
                        borderColor: '#1f2937',
                      }}
                    >
                      Create First Section
                    </Button>
                  )}
                </div>
              ),
            }}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default Sections;

