import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, DatePicker } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  FileTextOutlined,
  ProjectOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import * as applicationService from '../services/applicationService';
import * as vacancyService from '../services/vacancyService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const getStatusColor = (status) => {
  const colors = {
    new: 'blue',
    reviewing: 'cyan',
    shortlisted: 'green',
    rejected: 'red',
    archived: 'default',
  };
  return colors[status] || 'default';
};

const getStatusLabel = (status) => {
  const labels = {
    new: 'New',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const formatOptionLabel = (value) => {
  if (!value) return '';
  return String(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getDownloadName = (response, fallback) => {
  const disposition = response.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    experienceLevels: [],
    educationLevels: [],
  });
  const [loading, setLoading] = useState(false);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [vacancyFilter, setVacancyFilter] = useState(null);
  const [countryFilter, setCountryFilter] = useState(null);
  const [experienceFilter, setExperienceFilter] = useState(null);
  const [educationFilter, setEducationFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const fetchVacancies = async () => {
      setVacanciesLoading(true);
      try {
        const response = await vacancyService.getAllVacancies({
          page: 1,
          limit: 1000,
          status: 'published',
        });
        if (response.success) {
          setVacancies(response.data.vacancies || response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch vacancies:', error);
      } finally {
        setVacanciesLoading(false);
      }
    };

    const fetchFilterOptions = async () => {
      try {
        const response = await applicationService.getApplicationFilters();
        if (response.success) {
          setFilterOptions(response.data || {});
        }
      } catch (error) {
        console.error('Failed to fetch application filters:', error);
      }
    };

    fetchVacancies();
    fetchFilterOptions();
  }, []);

  const buildFilterParams = (overrides = {}) => {
    const params = {
      search: searchText || undefined,
      status: statusFilter || undefined,
      vacancyId: vacancyFilter || undefined,
      country: countryFilter || undefined,
      experienceLevel: experienceFilter || undefined,
      educationLevel: educationFilter || undefined,
      ...overrides,
    };

    if (dateRange && dateRange.length === 2) {
      params.startDate = dateRange[0].startOf('day').toISOString();
      params.endDate = dateRange[1].endOf('day').toISOString();
    }

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return params;
  };

  const fetchApplications = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = buildFilterParams({
        page: pagination.current,
        limit: pagination.pageSize,
        ...params,
      });

      const response = await applicationService.getAllApplications(queryParams);

      if (response.success) {
        setApplications(response.data.applications || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [
    pagination.current,
    pagination.pageSize,
    statusFilter,
    vacancyFilter,
    countryFilter,
    experienceFilter,
    educationFilter,
    dateRange,
  ]);

  const handleDelete = async () => {
    try {
      const response = await applicationService.deleteApplication(selectedApplication._id);
      if (response.success) {
        toast.success('Application deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedApplication(null);
        fetchApplications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete application');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchApplications({ search: value, page: 1 });
  };

  const handleExport = async (format) => {
    const fallbackNames = {
      excel: `acero-applications-excel-${dayjs().format('YYYY-MM-DD')}.xlsx`,
      pdf: `acero-applications-pdf-${dayjs().format('YYYY-MM-DD')}.pdf`,
      zip: `acero-applications-cvs-${dayjs().format('YYYY-MM-DD')}.zip`,
    };

    setExporting(format);
    try {
      const response = await applicationService.downloadApplicationsExport(format, buildFilterParams());
      const filename = getDownloadName(response, fallbackNames[format]);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} export downloaded`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    setVacancyFilter(null);
    setCountryFilter(null);
    setExperienceFilter(null);
    setEducationFilter(null);
    setDateRange(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Application',
      key: 'application',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <FileTextOutlined />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {record.firstName} {record.lastName}
              </span>
              {record.status === 'new' && (
                <Tag color="blue" className="text-xs">
                  New
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vacancy',
      key: 'vacancy',
      render: (_, record) => (
        record.vacancyId ? (
          <div className="flex items-center gap-2">
            <ProjectOutlined className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-gray-900 text-sm font-medium">
                {record.vacancyId.title || 'N/A'}
              </span>
              <span className="text-gray-500 text-xs">
                {record.vacancyId.department || ''} • {record.vacancyId.location || ''}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">{record.mobileNumber}</span>
          <span className="text-gray-500 text-xs">{record.country}</span>
        </div>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experienceLevel',
      key: 'experienceLevel',
      render: (level) => (
        <span className="text-gray-700 text-sm">{level || '—'}</span>
      ),
    },
    {
      title: 'Education',
      dataIndex: 'educationLevel',
      key: 'educationLevel',
      render: (level) => (
        <span className="text-gray-700 text-sm">{level || '—'}</span>
      ),
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
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">
            {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
          </span>
          <span className="text-gray-500 text-xs">
            {date ? dayjs(date).format('HH:mm') : '—'}
          </span>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            label: (
              <PermissionWrapper permission="applications" action="update">
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/enquiries-applications/applications/${record._id}`);
                  }}
                >
                  <EditOutlined />
                  <span>View/Edit</span>
                </div>
              </PermissionWrapper>
            ),
          },
          {
            key: 'delete',
            label: (
              <PermissionWrapper permission="applications" action="delete">
                <div
                  className="flex items-center gap-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedApplication(record);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <DeleteOutlined />
                  <span>Delete</span>
                </div>
              </PermissionWrapper>
            ),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Applications
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage job applications
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="primary"
              size="large"
              icon={<FileExcelOutlined />}
              loading={exporting === 'excel'}
              onClick={() => handleExport('excel')}
              className="bg-emerald-600"
            >
              Excel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<FilePdfOutlined />}
              loading={exporting === 'pdf'}
              onClick={() => handleExport('pdf')}
              className="bg-violet-600"
            >
              PDF
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<FileZipOutlined />}
              loading={exporting === 'zip'}
              onClick={() => handleExport('zip')}
              className="bg-sky-600"
            >
              CV ZIP
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,1fr)_repeat(2,minmax(180px,220px))_minmax(260px,300px)] gap-3">
              <Search
                placeholder="Search by name, email, phone, country, vacancy..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={searchText}
                onSearch={handleSearch}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  if (!e.target.value) {
                    handleSearch('');
                  }
                }}
                className="w-full"
              />
              <Select
                placeholder="Status"
                allowClear
                size="large"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="new">New</Option>
                <Option value="reviewing">Reviewing</Option>
                <Option value="shortlisted">Shortlisted</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Select
                placeholder="Country"
                allowClear
                size="large"
                value={countryFilter}
                onChange={(value) => {
                  setCountryFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
                showSearch
                optionFilterProp="children"
              >
                {(filterOptions.countries || []).map((country) => (
                  <Option key={country} value={country}>{country}</Option>
                ))}
              </Select>
              <RangePicker
                size="large"
                value={dateRange}
                placeholder={['Start Date', 'End Date']}
                onChange={(dates) => {
                  setDateRange(dates);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                format="YYYY-MM-DD"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_minmax(180px,220px)_minmax(180px,220px)_auto] gap-3">
              <Select
                placeholder="Vacancy"
                allowClear
                size="large"
                value={vacancyFilter}
                onChange={(value) => {
                  setVacancyFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
                loading={vacanciesLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {vacancies.map((vacancy) => (
                  <Option key={vacancy._id} value={vacancy._id}>
                    {vacancy.title} - {vacancy.department}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Experience"
                allowClear
                size="large"
                value={experienceFilter}
                onChange={(value) => {
                  setExperienceFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                {(filterOptions.experienceLevels || []).map((level) => (
                  <Option key={level} value={level}>{formatOptionLabel(level)}</Option>
                ))}
              </Select>
              <Select
                placeholder="Education"
                allowClear
                size="large"
                value={educationFilter}
                onChange={(value) => {
                  setEducationFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                {(filterOptions.educationLevels || []).map((level) => (
                  <Option key={level} value={level}>{formatOptionLabel(level)}</Option>
                ))}
              </Select>
              <Button size="large" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </Card>

        <Card
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={applications}
            loading={loading}
            rowKey="_id"
            className="custom-table applications-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} applications`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize,
                }));
              },
            }}
            scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
            onRow={(record) => ({
              onClick: () => {
                if (hasPermission('applications', 'update')) {
                  navigate(`/enquiries-applications/applications/${record._id}`);
                }
              },
              className: hasPermission('applications', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Application"
          content={`Are you sure you want to delete the application from "${selectedApplication?.firstName} ${selectedApplication?.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedApplication(null);
          }}
          okText="Delete"
          cancelText="Cancel"
        />
      </div>
    </MainLayout>
  );
};

export default Applications;