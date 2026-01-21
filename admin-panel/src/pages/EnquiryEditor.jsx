import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Descriptions, Space, Button, Tag, Divider, Alert } from 'antd';
import { HomeOutlined, MailOutlined, CheckCircleOutlined, MessageOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as enquiryService from '../services/enquiryService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const EnquiryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch enquiry data
  useEffect(() => {
    if (id) {
      fetchEnquiry();
    }
  }, [id]);

  const fetchEnquiry = async () => {
    setFetching(true);
    try {
      const response = await enquiryService.getEnquiry(id);
      if (response.success) {
        setEnquiry(response.data.enquiry);
      } else {
        toast.error('Enquiry not found');
        navigate('/enquiries-applications/enquiries');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch enquiry');
      navigate('/enquiries-applications/enquiries');
    } finally {
      setFetching(false);
    }
  };

  const handleMarkRead = async () => {
    if (!hasPermission('enquiries', 'update')) {
      toast.error('You do not have permission to update enquiries');
      return;
    }

    setLoading(true);
    try {
      const response = await enquiryService.markEnquiryRead(id);
      if (response.success) {
        toast.success('Enquiry marked as read');
        await fetchEnquiry();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark enquiry as read');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReplied = async () => {
    if (!hasPermission('enquiries', 'update')) {
      toast.error('You do not have permission to update enquiries');
      return;
    }

    setLoading(true);
    try {
      const response = await enquiryService.markEnquiryReplied(id);
      if (response.success) {
        toast.success('Enquiry marked as replied');
        await fetchEnquiry();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark enquiry as replied');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!hasPermission('enquiries', 'delete')) {
      toast.error('You do not have permission to archive enquiries');
      return;
    }

    setLoading(true);
    try {
      const response = await enquiryService.archiveEnquiry(id);
      if (response.success) {
        toast.success('Enquiry archived successfully');
        navigate('/enquiries-applications/enquiries');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive enquiry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      read: 'cyan',
      replied: 'green',
      archived: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      new: 'New',
      read: 'Read',
      replied: 'Replied',
      archived: 'Archived'
    };
    return texts[status] || status;
  };

  const getPurposeText = (purpose) => {
    const texts = {
      general: 'General Inquiry',
      sales: 'Sales Inquiry',
      support: 'Support Request',
      partnership: 'Partnership Inquiry',
      other: 'Other'
    };
    return texts[purpose] || purpose;
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

  if (!enquiry) {
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
                <a href="/enquiries-applications/enquiries">
                  <span>Enquiries</span>
                </a>
              ),
            },
            {
              title: <span>View Enquiry</span>,
            },
          ]}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Enquiry Details
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              View and manage enquiry information
            </p>
          </div>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/enquiries-applications/enquiries')}
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
              <Tag color={getStatusColor(enquiry.status)} className="text-sm px-3 py-1">
                {getStatusText(enquiry.status)}
              </Tag>
            </div>
            <Space>
              {enquiry.status === 'new' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleMarkRead}
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
                  Mark as Read
                </Button>
              )}
              {enquiry.status !== 'replied' && enquiry.status !== 'archived' && (
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={handleMarkReplied}
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
                  Mark as Replied
                </Button>
              )}
              {enquiry.status !== 'archived' && (
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
        {enquiry.notificationEmail && (
          <Alert
            message="Notification Email"
            description={`This enquiry was sent to: ${enquiry.notificationEmail}`}
            type="info"
            icon={<MailOutlined />}
            showIcon
          />
        )}

        {/* Enquiry Information */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enquiry Information</h2>
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
            <Descriptions.Item label="Purpose">
              <Tag color="blue">{getPurposeText(enquiry.purpose)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Subject">{enquiry.subject}</Descriptions.Item>
            <Descriptions.Item label="Full Name">{enquiry.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">
              <a href={`mailto:${enquiry.email}`} className="text-blue-600 hover:underline">
                {enquiry.email}
              </a>
            </Descriptions.Item>
            {enquiry.companyName && (
              <Descriptions.Item label="Company Name">{enquiry.companyName}</Descriptions.Item>
            )}
            <Descriptions.Item label="Mobile Number">
              <a href={`tel:${enquiry.mobileNumber}`} className="text-blue-600 hover:underline">
                {enquiry.mobileNumber}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Country">{enquiry.country}</Descriptions.Item>
            {enquiry.countryCode && (
              <Descriptions.Item label="Country Code">{enquiry.countryCode}</Descriptions.Item>
            )}
            {enquiry.telephoneNumber && (
              <Descriptions.Item label="Telephone Number">
                <a href={`tel:${enquiry.telephoneNumber}`} className="text-blue-600 hover:underline">
                  {enquiry.telephoneNumber}
                </a>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Submitted At">
              {dayjs(enquiry.submittedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {enquiry.ipAddress && (
              <Descriptions.Item label="IP Address">{enquiry.ipAddress}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Message */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Message</h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap">{enquiry.message}</p>
          </div>
        </Card>

        {/* Admin Tracking */}
        {(enquiry.readBy || enquiry.repliedBy) && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tracking</h2>
            <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
              {enquiry.readBy && (
                <>
                  <Descriptions.Item label="Read By">
                    {enquiry.readBy.firstName} {enquiry.readBy.lastName}
                    <br />
                    <span className="text-gray-500 text-sm">{enquiry.readBy.email}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Read At">
                    {enquiry.readAt ? dayjs(enquiry.readAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </>
              )}
              {enquiry.repliedBy && (
                <>
                  <Descriptions.Item label="Replied By">
                    {enquiry.repliedBy.firstName} {enquiry.repliedBy.lastName}
                    <br />
                    <span className="text-gray-500 text-sm">{enquiry.repliedBy.email}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Replied At">
                    {enquiry.repliedAt ? dayjs(enquiry.repliedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default EnquiryEditor;

