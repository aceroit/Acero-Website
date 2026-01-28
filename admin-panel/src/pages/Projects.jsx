import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Space } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  ProjectOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as projectService from '../services/projectService';
import * as referenceService from '../services/referenceService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

// Row actions with workflow-based visibility (Edit/Delete only when allowed by status + permission)
const ProjectRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'project',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('projects', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onNavigate(`/projects/${record._id}`),
    });
  }
  if (hasPermission('projects', 'delete') && workflowStatus.canDelete.canDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeleteClick(record),
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
          size="small"
          disabled={menuItems.length === 0}
        />
      </Dropdown>
    </div>
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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [industryFilter, setIndustryFilter] = useState(null);
  const [countryFilter, setCountryFilter] = useState(null);
  const [regionFilter, setRegionFilter] = useState(null);
  const [areaFilter, setAreaFilter] = useState(null);
  const [buildingTypeFilter, setBuildingTypeFilter] = useState(null);
  const [sortField, setSortField] = useState('order');
  const [sortOrder, setSortOrder] = useState('ascend');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [industries, setIndustries] = useState([]);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [buildingTypes, setBuildingTypes] = useState([]);

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Load reference options
  useEffect(() => {
    const load = async () => {
      try {
        const [ind, cnt, bt] = await Promise.all([
          referenceService.getIndustries(),
          referenceService.getCountries(),
          referenceService.getBuildingTypes(),
        ]);
        if (ind?.success && ind?.data?.industries) setIndustries(ind.data.industries);
        if (cnt?.success && cnt?.data?.countries) setCountries(cnt.data.countries);
        if (bt?.success && bt?.data?.buildingTypes) setBuildingTypes(bt.data.buildingTypes);
      } catch (e) {
        console.error('Failed to load reference options', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!countryFilter) {
      setRegions([]);
      setAreas([]);
      setRegionFilter(null);
      setAreaFilter(null);
      return;
    }
    referenceService.getRegions(countryFilter).then((res) => {
      if (res?.success && res?.data?.regions) setRegions(res.data.regions);
    });
    setRegionFilter(null);
    setAreaFilter(null);
    setAreas([]);
  }, [countryFilter]);

  useEffect(() => {
    if (!regionFilter) {
      setAreas([]);
      setAreaFilter(null);
      return;
    }
    referenceService.getAreas(regionFilter).then((res) => {
      if (res?.success && res?.data?.areas) setAreas(res.data.areas);
    });
    setAreaFilter(null);
  }, [regionFilter]);

  // Fetch projects
  const fetchProjects = async (params = {}) => {
    setLoading(true);
    try {
      const sortBy = params.sortBy ?? (sortField === 'createdAt' ? 'createdAt' : sortField === 'jobNumber' ? 'jobNumber' : 'order');
      const sortOrderApi = params.sortOrder ?? (sortOrder === 'descend' ? 'desc' : 'asc');
      const response = await projectService.getAllProjects({
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        industry: params.industry !== undefined ? params.industry : industryFilter,
        country: params.country !== undefined ? params.country : countryFilter,
        region: params.region !== undefined ? params.region : regionFilter,
        area: params.area !== undefined ? params.area : areaFilter,
        buildingType: params.buildingType !== undefined ? params.buildingType : buildingTypeFilter,
        sortBy: params.sortBy ?? sortBy,
        sortOrder: params.sortOrder ?? sortOrderApi,
        ...params,
      });

      if (response.success) {
        setProjects(response.data.projects || response.data || []);
        if (response.data.pagination?.total !== undefined) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.pagination.total,
          }));
        } else if (response.data.total !== undefined) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.total,
          }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [pagination.current, pagination.pageSize, statusFilter, industryFilter, countryFilter, regionFilter, areaFilter, buildingTypeFilter, sortField, sortOrder]);

  // Handle delete project
  const handleDelete = async () => {
    try {
      const response = await projectService.deleteProject(selectedProject._id);
      if (response.success) {
        toast.success('Project deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchProjects({ search: value });
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    if (sorter?.field != null && sorter?.order != null) {
      const field = sorter.field === 'project' ? 'jobNumber' : sorter.field;
      setSortField(field);
      setSortOrder(sorter.order);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  // Table columns (sortOrder per column for controlled sort display)
  const columns = [
    {
      title: 'Project',
      key: 'project',
      dataIndex: 'jobNumber',
      sorter: true,
      sortOrder: sortField === 'jobNumber' ? sortOrder : null,
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <ProjectOutlined className="text-xs" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-gray-900 text-sm truncate">{record.jobNumber}</span>
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs flex-shrink-0">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">
              {record.buildingType?.name || 'N/A'} • {record.industry?.name || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 180,
      render: (_, record) => {
        const locationParts = [];
        if (record.country?.name) locationParts.push(record.country.name);
        if (record.region?.name) locationParts.push(record.region.name);
        if (record.area?.name) locationParts.push(record.area.name);
        return (
          <span className="text-gray-700 text-sm truncate block" title={locationParts.join(', ')}>
            {locationParts.length > 0 ? locationParts.join(', ') : '—'}
          </span>
        );
      },
    },
    {
      title: 'Slug',
      dataIndex: 'jobNumberSlug',
      key: 'jobNumberSlug',
      width: 150,
      className: 'hidden md:table-cell',
      render: (slug) => (
        <span className="text-gray-700 font-mono text-xs truncate block" title={slug}>
          {slug || '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag 
          color={getStatusColor(status)}
          className="px-2 py-0.5 font-semibold rounded-full text-xs"
        >
          {getStatusLabel(status)}
        </Tag>
      ),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'In Review', value: 'in_review' },
        { text: 'Changes Requested', value: 'changes_requested' },
        { text: 'Pending Approval', value: 'pending_approval' },
        { text: 'Pending Publish', value: 'pending_publish' },
        { text: 'Published', value: 'published' },
        { text: 'Archived', value: 'archived' },
      ],
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      className: 'hidden lg:table-cell',
      render: (order) => (
        <span className="text-gray-700 text-sm">{order ?? 0}</span>
      ),
      sorter: true,
      sortOrder: sortField === 'order' ? sortOrder : null,
    },
    {
      title: 'Created By',
      key: 'createdBy',
      width: 140,
      className: 'hidden lg:table-cell',
      render: (_, record) => {
        const creator = record.createdBy;
        if (creator) {
          const name = creator.firstName && creator.lastName
            ? `${creator.firstName} ${creator.lastName}`
            : creator.email || 'Unknown';
          return <span className="text-gray-700 text-sm truncate block" title={name}>{name}</span>;
        }
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      className: 'hidden md:table-cell',
      render: (date) => (
        <span className="text-gray-600 text-xs">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
      sorter: true,
      sortOrder: sortField === 'createdAt' ? sortOrder : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <ProjectRowActions
          record={record}
          onNavigate={(path) => navigate(path)}
          onDeleteClick={(r) => {
            setSelectedProject(r);
            setIsDeleteModalOpen(true);
          }}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 lg:space-y-8 w-full max-w-full overflow-x-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Projects
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and organize your projects
            </p>
          </div>
          <PermissionWrapper resource="projects" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/projects/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Project
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search projects by job number, slug..."
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
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <Select
                placeholder="Status"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="draft">Draft</Option>
                <Option value="in_review">In Review</Option>
                <Option value="changes_requested">Changes Requested</Option>
                <Option value="pending_approval">Pending Approval</Option>
                <Option value="pending_publish">Pending Publish</Option>
                <Option value="published">Published</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Select
                placeholder="Industry"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={industryFilter}
                onChange={(v) => { setIndustryFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={industries.map((i) => ({ value: i._id, label: i.name }))}
              />
              <Select
                placeholder="Building Type"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={buildingTypeFilter}
                onChange={(v) => { setBuildingTypeFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={buildingTypes.map((b) => ({ value: b._id, label: b.name }))}
              />
              <Select
                placeholder="Country"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={countryFilter}
                onChange={(v) => { setCountryFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={countries.map((c) => ({ value: c._id, label: c.name + (c.code ? ` (${c.code})` : '') }))}
              />
              <Select
                placeholder="Region"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={regionFilter}
                onChange={(v) => { setRegionFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                disabled={!countryFilter}
                options={regions.map((r) => ({ value: r._id, label: r.name + (r.code ? ` (${r.code})` : '') }))}
              />
              <Select
                placeholder="Area"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={areaFilter}
                onChange={(v) => { setAreaFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                disabled={!regionFilter}
                options={areas.map((a) => ({ value: a._id, label: a.name + (a.code ? ` (${a.code})` : '') }))}
              />
            </div>
          </div>
        </Card>

        {/* Projects Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white w-full"
          bodyStyle={{ padding: 0 }}
        >
          <div className="overflow-x-auto w-full">
            <Table
              columns={columns}
              dataSource={projects}
              loading={loading}
              rowKey="_id"
              className="custom-table projects-table w-full"
              onChange={handleTableChange}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} projects`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, pageSize) => {
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || prev.pageSize,
                  }));
                },
              }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
              onRow={(record) => ({
                onClick: () => {
                  if (hasPermission('projects', 'update')) {
                    navigate(`/projects/${record._id}`);
                  }
                },
                className: hasPermission('projects', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
              })}
            />
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Project"
          content={`Are you sure you want to delete "${selectedProject?.jobNumber}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedProject(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default Projects;

