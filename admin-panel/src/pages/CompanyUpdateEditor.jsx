import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import CompanyUpdateForm from '../components/forms/CompanyUpdateForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as companyUpdateService from '../services/companyUpdateService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const CompanyUpdateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [companyUpdate, setCompanyUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: companyUpdate?.status || 'draft',
    resourceType: 'company-update',
    createdBy: companyUpdate?.createdBy?._id || companyUpdate?.createdBy,
  });

  // Fetch company update data if editing
  useEffect(() => {
    if (isEdit) {
      fetchCompanyUpdate();
    }
  }, [id]);

  const fetchCompanyUpdate = async () => {
    setFetching(true);
    try {
      const response = await companyUpdateService.getCompanyUpdate(id);
      if (response.success) {
        setCompanyUpdate(response.data.companyUpdate);
      } else {
        toast.error('Company update not found');
        navigate('/company-updates');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch company update');
      navigate('/company-updates');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this company update');
          setLoading(false);
          return;
        }
        
        response = await companyUpdateService.updateCompanyUpdate(id, values);
      } else {
        response = await companyUpdateService.createCompanyUpdate(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Company update updated successfully' : 'Company update created successfully');
        
        if (isEdit) {
          // After updating, refresh the company update data
          await fetchCompanyUpdate();
        } else {
          // After creating, redirect to the edit page
          const newUpdateId = response.data?.companyUpdate?._id || response.data?.companyUpdate?.id;
          if (newUpdateId) {
            navigate(`/company-updates/${newUpdateId}`);
          } else {
            navigate('/company-updates');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update company update' : 'Failed to create company update');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/company-updates');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh company update data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchCompanyUpdate();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchCompanyUpdate();
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
        <a href="/company-updates">
          <span>Company Updates</span>
        </a>
      ),
    },
    ...(isEdit && companyUpdate
      ? [
          {
            title: <span>{companyUpdate.title || 'Company Update'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Company Update</span>,
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
  if (!hasPermission('company-updates', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} company updates.</p>
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
              {isEdit ? `Edit Company Update: ${companyUpdate?.title || ''}` : 'Create New Company Update'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update company update details and content'
                : 'Create a new company update or news post'
              }
            </p>
          </div>
          {isEdit && companyUpdate && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={companyUpdate.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="company-update"
                  resourceId={id}
                  currentStatus={companyUpdate.status}
                  createdBy={companyUpdate.createdBy?._id || companyUpdate.createdBy}
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
          {isEdit && companyUpdate ? (
            <WorkflowStatusGuard
              status={companyUpdate.status}
              resourceType="company-update"
              resourceId={id}
              createdBy={companyUpdate.createdBy?._id || companyUpdate.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <CompanyUpdateForm
                initialValues={companyUpdate || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <CompanyUpdateForm
              initialValues={companyUpdate || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && companyUpdate && (
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
                        navigate(`/versions/company-update/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="company-update"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('company-update', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchCompanyUpdate();
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

export default CompanyUpdateEditor;

