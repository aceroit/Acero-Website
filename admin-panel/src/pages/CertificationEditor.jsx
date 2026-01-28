import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import CertificationForm from '../components/forms/CertificationForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as certificationService from '../services/certificationService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const CertificationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: certification?.status || 'draft',
    resourceType: 'certification',
    createdBy: certification?.createdBy?._id || certification?.createdBy,
  });

  // Fetch certification data if editing
  useEffect(() => {
    if (isEdit) {
      fetchCertification();
    }
  }, [id]);

  const fetchCertification = async () => {
    setFetching(true);
    try {
      const response = await certificationService.getCertification(id);
      if (response.success) {
        setCertification(response.data.certification);
      } else {
        toast.error('Certification not found');
        navigate('/certifications');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch certification');
      navigate('/certifications');
    } finally {
      setFetching(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (isEdit) {
        // Check workflow status permissions before submitting
        if (!workflowStatus.canEdit.canEdit) {
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this certification');
          setLoading(false);
          return;
        }
        
        response = await certificationService.updateCertification(id, values);
      } else {
        response = await certificationService.createCertification(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Certification updated successfully' : 'Certification created successfully');
        
        if (isEdit) {
          // After updating, refresh the certification data
          await fetchCertification();
        } else {
          // After creating, redirect to the edit page
          const newCertificationId = response.data?.certification?._id || response.data?.certification?.id;
          if (newCertificationId) {
            navigate(`/certifications/${newCertificationId}`);
          } else {
            navigate('/certifications');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update certification' : 'Failed to create certification');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/certifications');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh certification data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchCertification();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchCertification();
      }, 500);
    }
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <a href="/dashboard">
          <HomeOutlined />
        </a>
      ),
    },
    {
      title: (
        <a href="/certifications">
          <span>Certifications</span>
        </a>
      ),
    },
    ...(isEdit && certification
      ? [
          {
            title: <span>{certification.name || 'Certification'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Certification</span>,
          },
        ]),
  ];

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  // Check permissions
  const requiredPermission = isEdit ? 'update' : 'create';
  if (!hasPermission('certifications', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} certifications.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb
          items={breadcrumbItems}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {isEdit ? `Edit Certification: ${certification?.name || ''}` : 'Create New Certification'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update certification details and information'
                : 'Create a new certification entry'
              }
            </p>
          </div>
          {isEdit && certification && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={certification.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="certification"
                  resourceId={id}
                  currentStatus={certification.status}
                  createdBy={certification.createdBy?._id || certification.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && certification ? (
            <WorkflowStatusGuard
              status={certification.status}
              resourceType="certification"
              resourceId={id}
              createdBy={certification.createdBy?._id || certification.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <CertificationForm
                initialValues={certification || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <CertificationForm
              initialValues={certification || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && certification && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <Collapse
              items={[
                {
                  key: 'timeline',
                  label: (
                    <Space>
                      <HistoryOutlined />
                      <span>Version History & Workflow Timeline</span>
                    </Space>
                  ),
                  extra: (
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/versions/certification/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="certification"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('certification', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchCertification();
                          }
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to restore version');
                        }
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default CertificationEditor;

