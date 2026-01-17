import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import AreaForm from '../components/forms/AreaForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as areaService from '../services/areaService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const AreaEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: area?.status || 'draft',
    resourceType: 'area',
    createdBy: area?.createdBy?._id || area?.createdBy,
  });

  // Fetch area data if editing
  useEffect(() => {
    if (isEdit) {
      fetchArea();
    }
  }, [id]);

  const fetchArea = async () => {
    setFetching(true);
    try {
      const response = await areaService.getArea(id);
      if (response.success) {
        setArea(response.data.area);
      } else {
        toast.error('Area not found');
        navigate('/areas');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch area');
      navigate('/areas');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this area');
          setLoading(false);
          return;
        }
        
        response = await areaService.updateArea(id, values);
      } else {
        response = await areaService.createArea(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Area updated successfully' : 'Area created successfully');
        
        if (isEdit) {
          // After updating, refresh the area data
          await fetchArea();
        } else {
          // After creating, redirect to the edit page
          const newAreaId = response.data?.area?._id || response.data?.area?.id;
          if (newAreaId) {
            navigate(`/areas/${newAreaId}`);
          } else {
            navigate('/areas');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update area' : 'Failed to create area');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/areas');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh area data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchArea();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchArea();
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
        <a href="/areas">
          <span>Areas</span>
        </a>
      ),
    },
    ...(isEdit && area
      ? [
          {
            title: <span>{area.name || 'Area'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Area</span>,
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
  if (!hasPermission('areas', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} areas.</p>
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
              {isEdit ? `Edit Area: ${area?.name || ''}` : 'Create New Area'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update area details'
                : 'Create a new area for location references'
              }
            </p>
          </div>
          {isEdit && area && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={area.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="area"
                  resourceId={id}
                  currentStatus={area.status}
                  createdBy={area.createdBy?._id || area.createdBy}
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
          {isEdit && area ? (
            <WorkflowStatusGuard
              status={area.status}
              resourceType="area"
              resourceId={id}
              createdBy={area.createdBy?._id || area.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <AreaForm
                initialValues={area || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <AreaForm
              initialValues={area || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && area && (
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
                        navigate(`/versions/area/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="area"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('area', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchArea();
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

export default AreaEditor;

