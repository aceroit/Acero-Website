import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import BuildingTypeForm from '../components/forms/BuildingTypeForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as buildingTypeService from '../services/buildingTypeService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const BuildingTypeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [buildingType, setBuildingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: buildingType?.status || 'draft',
    resourceType: 'building-type',
    createdBy: buildingType?.createdBy?._id || buildingType?.createdBy,
  });

  // Fetch building type data if editing
  useEffect(() => {
    if (isEdit) {
      fetchBuildingType();
    }
  }, [id]);

  const fetchBuildingType = async () => {
    setFetching(true);
    try {
      const response = await buildingTypeService.getBuildingType(id);
      if (response.success) {
        setBuildingType(response.data.buildingType);
      } else {
        toast.error('Building type not found');
        navigate('/building-types');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch building type');
      navigate('/building-types');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this building type');
          setLoading(false);
          return;
        }
        
        response = await buildingTypeService.updateBuildingType(id, values);
      } else {
        response = await buildingTypeService.createBuildingType(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Building type updated successfully' : 'Building type created successfully');
        
        if (isEdit) {
          // After updating, refresh the building type data
          await fetchBuildingType();
        } else {
          // After creating, redirect to the edit page
          const newBuildingTypeId = response.data?.buildingType?._id || response.data?.buildingType?.id;
          if (newBuildingTypeId) {
            navigate(`/building-types/${newBuildingTypeId}`);
          } else {
            navigate('/building-types');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update building type' : 'Failed to create building type');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/building-types');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh building type data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchBuildingType();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchBuildingType();
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
        <a href="/building-types">
          <span>Building Types</span>
        </a>
      ),
    },
    ...(isEdit && buildingType
      ? [
          {
            title: <span>{buildingType.name || 'Building Type'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Building Type</span>,
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
  if (!hasPermission('building-types', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} building types.</p>
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
              {isEdit ? `Edit Building Type: ${buildingType?.name || ''}` : 'Create New Building Type'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update building type details'
                : 'Create a new building type for projects'
              }
            </p>
          </div>
          {isEdit && buildingType && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={buildingType.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="building-type"
                  resourceId={id}
                  currentStatus={buildingType.status}
                  createdBy={buildingType.createdBy?._id || buildingType.createdBy}
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
          {isEdit && buildingType ? (
            <WorkflowStatusGuard
              status={buildingType.status}
              resourceType="building-type"
              resourceId={id}
              createdBy={buildingType.createdBy?._id || buildingType.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <BuildingTypeForm
                initialValues={buildingType || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <BuildingTypeForm
              initialValues={buildingType || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && buildingType && (
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
                        navigate(`/versions/building-type/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="building-type"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('building-type', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchBuildingType();
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

export default BuildingTypeEditor;

