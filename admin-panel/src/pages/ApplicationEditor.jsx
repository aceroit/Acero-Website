import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Descriptions, Space, Button, Tag, Divider, Alert, Input, Form, Modal } from 'antd';
import { HomeOutlined, MailOutlined, EyeOutlined, DownloadOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as applicationService from '../services/applicationService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ApplicationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  // Fetch application data
  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    setFetching(true);
    try {
      const response = await applicationService.getApplication(id);
      if (response.success) {
        setApplication(response.data.application);
        form.setFieldsValue({ notes: response.data.application.notes || '' });
      } else {
        toast.error('Application not found');
        navigate('/enquiries-applications/applications');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch application');
      navigate('/enquiries-applications/applications');
    } finally {
      setFetching(false);
    }
  };

  const handleMarkReviewing = async () => {
    if (!hasPermission('applications', 'update')) {
      toast.error('You do not have permission to update applications');
      return;
    }

    setLoading(true);
    try {
      const response = await applicationService.markReviewing(id);
      if (response.success) {
        toast.success('Application marked as reviewing');
        await fetchApplication();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark application as reviewing');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async () => {
    if (!hasPermission('applications', 'update')) {
      toast.error('You do not have permission to update applications');
      return;
    }

    setLoading(true);
    try {
      const response = await applicationService.shortlistApplication(id);
      if (response.success) {
        toast.success('Application shortlisted');
        await fetchApplication();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to shortlist application');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!hasPermission('applications', 'update')) {
      toast.error('You do not have permission to update applications');
      return;
    }

    setLoading(true);
    try {
      const response = await applicationService.rejectApplication(id);
      if (response.success) {
        toast.success('Application rejected');
        await fetchApplication();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!hasPermission('applications', 'delete')) {
      toast.error('You do not have permission to archive applications');
      return;
    }

    setLoading(true);
    try {
      const response = await applicationService.archiveApplication(id);
      if (response.success) {
        toast.success('Application archived successfully');
        navigate('/enquiries-applications/applications');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive application');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (values) => {
    if (!hasPermission('applications', 'update')) {
      toast.error('You do not have permission to update applications');
      return;
    }

    setNotesLoading(true);
    try {
      const response = await applicationService.updateApplication(id, { notes: values.notes });
      if (response.success) {
        toast.success('Notes updated successfully');
        setNotesEditing(false);
        await fetchApplication();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleViewCV = () => {
    if (application?.cvFile?.url) {
      window.open(application.cvFile.url, '_blank');
    }
  };

  const handleDownloadCV = () => {
    if (application?.cvFile?.url) {
      const link = document.createElement('a');
      link.href = application.cvFile.url;
      link.download = application.cvFile.filename || 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      reviewing: 'cyan',
      shortlisted: 'green',
      rejected: 'red',
      archived: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      new: 'New',
      reviewing: 'Reviewing',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      archived: 'Archived'
    };
    return texts[status] || status;
  };

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              title: (
                <a href="/dashboard">
                  <HomeOutlined />
                </a>
              ),
            },
            {
              title: (
                <a href="/enquiries-applications/applications">
                  <span>Applications</span>
                </a>
              ),
            },
            {
              title: <span>View Application</span>,
            },
          ]}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Application Details
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              View and manage application information
            </p>
          </div>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/enquiries-applications/applications')}
              size="large"
            >
              Back to List
            </Button>
          </Space>
        </div>

        {/* Status and Actions Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-semibold">Status:</span>
              <Tag color={getStatusColor(application.status)} className="text-sm px-3 py-1">
                {getStatusText(application.status)}
              </Tag>
            </div>
            <Space>
              {application.status === 'new' && (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={handleMarkReviewing}
                  loading={loading}
                  size="large"
                  className="text-white"
                  style={{
                    backgroundColor: '#1f2937',
                    borderColor: '#1f2937',
                    height: '44px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Mark as Reviewing
                </Button>
              )}
              {application.status !== 'shortlisted' && application.status !== 'rejected' && application.status !== 'archived' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleShortlist}
                  loading={loading}
                  size="large"
                  className="text-white"
                  style={{
                    backgroundColor: '#1f2937',
                    borderColor: '#1f2937',
                    height: '44px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Shortlist
                </Button>
              )}
              {application.status !== 'rejected' && application.status !== 'archived' && (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleReject}
                  loading={loading}
                  size="large"
                >
                  Reject
                </Button>
              )}
              {application.status !== 'archived' && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleArchive}
                  loading={loading}
                  size="large"
                >
                  Archive
                </Button>
              )}
            </Space>
          </div>
        </Card>

        {/* Notification Email Info */}
        {application.vacancyId?.notificationEmail && (
          <Alert
            message="Notification Email"
            description={`This application was sent to: ${application.vacancyId.notificationEmail}`}
            type="info"
            icon={<MailOutlined />}
            showIcon
          />
        )}

        {/* Vacancy Information */}
        {application.vacancyId && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applied For</h2>
            <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
              <Descriptions.Item label="Position">{application.vacancyId.title}</Descriptions.Item>
              <Descriptions.Item label="Department">{application.vacancyId.department}</Descriptions.Item>
              <Descriptions.Item label="Location">{application.vacancyId.location}</Descriptions.Item>
              <Descriptions.Item label="Type">{application.vacancyId.type}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Application Information */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Information</h2>
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
            <Descriptions.Item label="First Name">{application.firstName}</Descriptions.Item>
            <Descriptions.Item label="Last Name">{application.lastName}</Descriptions.Item>
            <Descriptions.Item label="Email">
              <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">
                {application.email}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Mobile Number">
              <a href={`tel:${application.mobileNumber}`} className="text-blue-600 hover:underline">
                {application.mobileNumber}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Country">{application.country}</Descriptions.Item>
            <Descriptions.Item label="Experience Level">{application.experienceLevel}</Descriptions.Item>
            <Descriptions.Item label="Education Level">{application.educationLevel}</Descriptions.Item>
            <Descriptions.Item label="Engineering Degree">
              {application.hasEngineeringDegree === 'yes' ? (
                <Tag color="green">Yes</Tag>
              ) : (
                <Tag color="default">No</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Languages" span={2}>
              <Space wrap>
                {application.languages?.map((lang, index) => (
                  <Tag key={index} color="blue">{lang}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted At">
              {dayjs(application.submittedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {application.ipAddress && (
              <Descriptions.Item label="IP Address">{application.ipAddress}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Cover Letter */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap">{application.coverLetter}</p>
          </div>
        </Card>

        {/* CV File */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CV / Resume</h2>
          {application.cvFile ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileTextOutlined className="text-2xl text-gray-600" />
                  <div>
                    <p className="text-gray-900 font-medium">{application.cvFile.filename}</p>
                    <p className="text-gray-500 text-sm">
                      {formatFileSize(application.cvFile.size)} • {application.cvFile.mimeType || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handleViewCV}
                  >
                    View CV
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadCV}
                    size="large"
                    className="text-white"
                    style={{
                      backgroundColor: '#1f2937',
                      borderColor: '#1f2937',
                      height: '44px',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    Download CV
                  </Button>
                </Space>
              </div>
            </div>
          ) : (
            <Alert message="No CV file available" type="warning" />
          )}
        </Card>

        {/* Notes Section */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            {!notesEditing && (
              <Button
                icon={<EditOutlined />}
                onClick={() => setNotesEditing(true)}
                disabled={!hasPermission('applications', 'update')}
                size="large"
              >
                Edit Notes
              </Button>
            )}
          </div>
          {notesEditing ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveNotes}
            >
              <Form.Item name="notes">
                <TextArea
                  rows={6}
                  placeholder="Add notes about this application..."
                  className="border-gray-300"
                />
              </Form.Item>
              <div className="flex justify-end gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={notesLoading}
                  size="large"
                  className="text-white"
                  style={{
                    backgroundColor: '#1f2937',
                    borderColor: '#1f2937',
                    height: '44px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Save Notes
                </Button>
                <Button
                  onClick={() => {
                    setNotesEditing(false);
                    form.setFieldsValue({ notes: application.notes || '' });
                  }}
                  disabled={notesLoading}
                  size="large"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
              {application.notes ? (
                <p className="text-gray-900 whitespace-pre-wrap">{application.notes}</p>
              ) : (
                <p className="text-gray-500 italic">No notes added yet</p>
              )}
            </div>
          )}
        </Card>

        {/* Admin Tracking */}
        {application.reviewedBy && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tracking</h2>
            <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
              <Descriptions.Item label="Reviewed By">
                {application.reviewedBy.firstName} {application.reviewedBy.lastName}
                <br />
                <span className="text-gray-500 text-sm">{application.reviewedBy.email}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Reviewed At">
                {application.reviewedAt ? dayjs(application.reviewedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ApplicationEditor;

