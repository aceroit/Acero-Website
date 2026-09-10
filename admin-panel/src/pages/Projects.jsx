import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Image } from 'antd';
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
import { getCmsAssetUrl } from '../utils/cmsAssetUrl';

const { Search } = Input;
const { Option } = Select;

const toApiSortOrder = (value) => (value === 'desc' || value === 'descend' ? 'desc' : 'asc');

const getReferenceLabel = (reference) => reference?.name || '-';

const getCreatorName = (creator) => {
  if (!creator) return '-';
  if (typeof creator === 'string') return creator;

  const fullName = [creator.firstName, creator.lastName].filter(Boolean).join(' ').trim();
  return fullName || creator.email || 'Unknown';
};

const filterOption = (input, option) =>
  String(option?.label ?? option?.children ?? '').toLowerCase().includes(input.toLowerCase());

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
  const [buildingTypeFilter, setBuildingTypeFilter] = useState(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('descend');
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
  const [buildingTypes, setBuildingTypes] = useState([]);

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Load reference options used by the Projects table filters.
  useEffect(() => {
    const load = async () => {
      try {
        const [ind, cnt, bt, reg] = await Promise.all([
          referenceService.getIndustries(),
          referenceService.getCountries(),
          referenceService.getBuildingTypes(),
          referenceService.getRegions(),
        ]);
        if (ind?.success && ind?.data?.industries) setIndustries(ind.data.industries);
        if (cnt?.success && cnt?.data?.countries) setCountries(cnt.data.countries);
        if (bt?.success && bt?.data?.buildingTypes) setBuildingTypes(bt.data.buildingTypes);
        if (reg?.success && reg?.data?.regions) setRegions(reg.data.regions);
      } catch (e) {
        console.error('Failed to load reference options', e);
      }
    };
    load();
  }, []);

  // Fetch projects
  const fetchProjects = async (params = {}) => {
    setLoading(true);
    try {
      const sortBy = params.sortBy ?? sortField;
      const sortOrderApi = toApiSortOrder(params.sortOrder ?? sortOrder);
      const response = await projectService.getAllProjects({
        ...params,
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        industry: params.industry !== undefined ? params.industry : industryFilter,
        country: params.country !== undefined ? params.country : countryFilter,
        region: params.region !== undefined ? params.region : regionFilter,
        buildingType: params.buildingType !== undefined ? params.buildingType : buildingTypeFilter,
        sortBy,
        sortOrder: sortOrderApi,
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

  // Refetch when filters or sort change (not when page/pageSize change; those are handled in handleTableChange).
  useEffect(() => {
    fetchProjects();
  }, [statusFilter, industryFilter, countryFilter, regionFilter, buildingTypeFilter, sortField, sortOrder]);

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
    fetchProjects({ search: value, page: 1 });
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    setIndustryFilter(null);
    setCountryFilter(null);
    setRegionFilter(null);
    setBuildingTypeFilter(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchProjects({
      page: 1,
      search: '',
      status: null,
      industry: null,
      country: null,
      region: null,
      buildingType: null,
    });
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    // Pagination change: update state and fetch that page immediately
    if (paginationConfig && (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize)) {
      const newCurrent = paginationConfig.current ?? pagination.current;
      const newPageSize = paginationConfig.pageSize ?? pagination.pageSize;
      setPagination((prev) => ({
        ...prev,
        current: newCurrent,
        pageSize: newPageSize,
      }));
      fetchProjects({ page: newCurrent, limit: newPageSize });
      return;
    }
    // Sort change: update state and refetch page 1 (useEffect will run due to sortField/sortOrder change)
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
      width: 260,
      fixed: 'left',
      render: (_, record) => {
        const thumbnailUrl = getCmsAssetUrl(record.thumbnailImage);

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-10 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0 overflow-hidden">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={record.jobNumber || 'Project thumbnail'}
                  width={56}
                  height={40}
                  preview={false}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <ProjectOutlined className="text-base" />
              )}
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
                {record.jobNumberSlug || record.typeSlug || '-'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Region',
      key: 'region',
      width: 140,
      render: (_, record) => (
        <span className="text-gray-700 text-sm truncate block" title={getReferenceLabel(record.region)}>
          {getReferenceLabel(record.region)}
        </span>
      ),
    },
    {
      title: 'Country',
      key: 'country',
      width: 140,
      render: (_, record) => (
        <span className="text-gray-700 text-sm truncate block" title={getReferenceLabel(record.country)}>
          {getReferenceLabel(record.country)}
        </span>
      ),
    },
    {
      title: 'Industry',
      key: 'industry',
      width: 160,
      render: (_, record) => (
        <span className="text-gray-700 text-sm truncate block" title={getReferenceLabel(record.industry)}>
          {getReferenceLabel(record.industry)}
        </span>
      ),
    },
    {
      title: 'Building Type',
      key: 'buildingType',
      width: 170,
      render: (_, record) => (
        <span className="text-gray-700 text-sm truncate block" title={getReferenceLabel(record.buildingType)}>
          {getReferenceLabel(record.buildingType)}
        </span>
      ),
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
    },
    {
      title: 'Created By',
      key: 'createdBy',
      width: 160,
      render: (_, record) => {
        const name = getCreatorName(record.createdBy);
        return <span className="text-gray-700 text-sm truncate block" title={name}>{name}</span>;
      },
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
                placeholder="Search by project, country, region, industry, building type..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={searchText}
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch('');
                  } else {
                    setSearchText(e.target.value);
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
                showSearch
                filterOption={filterOption}
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
                showSearch
                filterOption={filterOption}
              />
              <Select
                placeholder="Building Type"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={buildingTypeFilter}
                onChange={(v) => { setBuildingTypeFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={buildingTypes.map((b) => ({ value: b._id, label: b.name }))}
                showSearch
                filterOption={filterOption}
              />
              <Select
                placeholder="Country"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={countryFilter}
                onChange={(v) => { setCountryFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={countries.map((c) => ({ value: c._id, label: c.name + (c.code ? ` (${c.code})` : '') }))}
                showSearch
                filterOption={filterOption}
              />
              <Select
                placeholder="Region"
                allowClear
                size="large"
                style={{ minWidth: 140 }}
                value={regionFilter}
                onChange={(v) => { setRegionFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
                options={regions.map((r) => ({ value: r._id, label: r.name + (r.code ? ` (${r.code})` : '') }))}
                showSearch
                filterOption={filterOption}
              />
              <Button size="large" onClick={resetFilters}>
                Reset
              </Button>
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
                  total > 0 ? `${range[0]}-${range[1]} of ${total} projects` : '0 projects',
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, pageSize) => {
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || prev.pageSize,
                  }));
                  fetchProjects({ page, limit: pageSize || pagination.pageSize });
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

