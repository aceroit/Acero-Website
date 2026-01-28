import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import RegionForm from '../components/forms/RegionForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as regionService from '../services/regionService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const RegionEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: region?.status || 'draft',
    resourceType: 'region',
    createdBy: region?.createdBy?._id || region?.createdBy,
  });

  // Fetch region data if editing
  useEffect(() => {
    if (isEdit) {
      fetchRegion();
    }
  }, [id]);

  const fetchRegion = async () => {
    setFetching(true);
    try {
      const response = await regionService.getRegion(id);
      if (response.success) {
        setRegion(response.data.region);
      } else {
        toast.error('Region not found');
        navigate('/regions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch region');
      navigate('/regions');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this region');
          setLoading(false);
          return;
        }
        
        response = await regionService.updateRegion(id, values);
      } else {
        response = await regionService.createRegion(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Region updated successfully' : 'Region created successfully');
        
        if (isEdit) {
          // After updating, refresh the region data
          await fetchRegion();
        } else {
          // After creating, redirect to the edit page
          const newRegionId = response.data?.region?._id || response.data?.region?.id;
          if (newRegionId) {
            navigate(`/regions/${newRegionId}`);
          } else {
            navigate('/regions');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update region' : 'Failed to create region');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/regions');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh region data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchRegion();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchRegion();
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
        <a href="/regions">
          <span>Regions</span>
        </a>
      ),
    },
    ...(isEdit && region
      ? [
          {
            title: <span>{region.name || 'Region'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Region</span>,
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
  if (!hasPermission('regions', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} regions.</p>
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
              {isEdit ? `Edit Region: ${region?.name || ''}` : 'Create New Region'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update region details'
                : 'Create a new region for location references'
              }
            </p>
          </div>
          {isEdit && region && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={region.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="region"
                  resourceId={id}
                  currentStatus={region.status}
                  createdBy={region.createdBy?._id || region.createdBy}
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
          {isEdit && region ? (
            <WorkflowStatusGuard
              status={region.status}
              resourceType="region"
              resourceId={id}
              createdBy={region.createdBy?._id || region.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <RegionForm
                initialValues={region || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <RegionForm
              initialValues={region || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && region && (
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
                        navigate(`/versions/region/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="region"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('region', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchRegion();
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

export default RegionEditor;

