import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import BrochureForm from '../components/forms/BrochureForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as brochureService from '../services/brochureService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const BrochureEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [brochure, setBrochure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: brochure?.status || 'draft',
    resourceType: 'brochure',
    createdBy: brochure?.createdBy?._id || brochure?.createdBy,
  });

  // Fetch brochure data if editing
  useEffect(() => {
    if (isEdit) {
      fetchBrochure();
    }
  }, [id]);

  const fetchBrochure = async () => {
    setFetching(true);
    try {
      const response = await brochureService.getBrochure(id);
      if (response.success) {
        setBrochure(response.data.brochure);
      } else {
        toast.error('Brochure not found');
        navigate('/brochures');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch brochure');
      navigate('/brochures');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this brochure');
          setLoading(false);
          return;
        }
        
        response = await brochureService.updateBrochure(id, values);
      } else {
        response = await brochureService.createBrochure(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Brochure updated successfully' : 'Brochure created successfully');
        
        if (isEdit) {
          // After updating, refresh the brochure data
          await fetchBrochure();
        } else {
          // After creating, redirect to the edit page
          const newBrochureId = response.data?.brochure?._id || response.data?.brochure?.id;
          if (newBrochureId) {
            navigate(`/brochures/${newBrochureId}`);
          } else {
            navigate('/brochures');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update brochure' : 'Failed to create brochure');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/brochures');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh brochure data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchBrochure();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchBrochure();
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
        <a href="/brochures">
          <span>Brochures</span>
        </a>
      ),
    },
    ...(isEdit && brochure
      ? [
          {
            title: <span>{brochure.title || 'Brochure'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Brochure</span>,
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
  if (!hasPermission('brochures', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} brochures.</p>
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
              {isEdit ? `Edit Brochure: ${brochure?.title || ''}` : 'Create New Brochure'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update brochure details and content'
                : 'Create a new brochure for download or viewing'
              }
            </p>
          </div>
          {isEdit && brochure && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={brochure.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="brochure"
                  resourceId={id}
                  currentStatus={brochure.status}
                  createdBy={brochure.createdBy?._id || brochure.createdBy}
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
          {isEdit && brochure ? (
            <WorkflowStatusGuard
              status={brochure.status}
              resourceType="brochure"
              resourceId={id}
              createdBy={brochure.createdBy?._id || brochure.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <BrochureForm
                initialValues={brochure || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <BrochureForm
              initialValues={brochure || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && brochure && (
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
                        navigate(`/versions/brochure/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="brochure"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('brochure', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchBrochure();
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

export default BrochureEditor;

