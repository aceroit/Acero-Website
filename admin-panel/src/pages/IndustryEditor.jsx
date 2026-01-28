import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import IndustryForm from '../components/forms/IndustryForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as industryService from '../services/industryService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const IndustryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [industry, setIndustry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: industry?.status || 'draft',
    resourceType: 'industry',
    createdBy: industry?.createdBy?._id || industry?.createdBy,
  });

  // Fetch industry data if editing
  useEffect(() => {
    if (isEdit) {
      fetchIndustry();
    }
  }, [id]);

  const fetchIndustry = async () => {
    setFetching(true);
    try {
      const response = await industryService.getIndustry(id);
      if (response.success) {
        setIndustry(response.data.industry);
      } else {
        toast.error('Industry not found');
        navigate('/industries');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch industry');
      navigate('/industries');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this industry');
          setLoading(false);
          return;
        }
        
        response = await industryService.updateIndustry(id, values);
      } else {
        response = await industryService.createIndustry(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Industry updated successfully' : 'Industry created successfully');
        
        if (isEdit) {
          // After updating, refresh the industry data
          await fetchIndustry();
        } else {
          // After creating, redirect to the edit page
          const newIndustryId = response.data?.industry?._id || response.data?.industry?.id;
          if (newIndustryId) {
            navigate(`/industries/${newIndustryId}`);
          } else {
            navigate('/industries');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update industry' : 'Failed to create industry');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/industries');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh industry data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchIndustry();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchIndustry();
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
        <a href="/industries">
          <span>Industries</span>
        </a>
      ),
    },
    ...(isEdit && industry
      ? [
          {
            title: <span>{industry.name || 'Industry'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Industry</span>,
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
  if (!hasPermission('industries', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} industries.</p>
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
              {isEdit ? `Edit Industry: ${industry?.name || ''}` : 'Create New Industry'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update industry details'
                : 'Create a new industry for projects'
              }
            </p>
          </div>
          {isEdit && industry && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={industry.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="industry"
                  resourceId={id}
                  currentStatus={industry.status}
                  createdBy={industry.createdBy?._id || industry.createdBy}
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
          {isEdit && industry ? (
            <WorkflowStatusGuard
              status={industry.status}
              resourceType="industry"
              resourceId={id}
              createdBy={industry.createdBy?._id || industry.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <IndustryForm
                initialValues={industry || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <IndustryForm
              initialValues={industry || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && industry && (
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
                        navigate(`/versions/industry/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="industry"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('industry', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchIndustry();
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

export default IndustryEditor;

