import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import BranchForm from '../components/forms/BranchForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as branchService from '../services/branchService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const BranchEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: branch?.status || 'draft',
    resourceType: 'branch',
    createdBy: branch?.createdBy?._id || branch?.createdBy,
  });

  // Fetch branch data if editing
  useEffect(() => {
    if (isEdit) {
      fetchBranch();
    }
  }, [id]);

  const fetchBranch = async () => {
    setFetching(true);
    try {
      const response = await branchService.getBranch(id);
      if (response.success) {
        setBranch(response.data.branch);
      } else {
        toast.error('Branch not found');
        navigate('/branches');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch branch');
      navigate('/branches');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this branch');
          setLoading(false);
          return;
        }
        
        response = await branchService.updateBranch(id, values);
      } else {
        response = await branchService.createBranch(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Branch updated successfully' : 'Branch created successfully');
        
        if (isEdit) {
          // After updating, refresh the branch data
          await fetchBranch();
        } else {
          // After creating, redirect to the edit page
          const newBranchId = response.data?.branch?._id || response.data?.branch?.id;
          if (newBranchId) {
            navigate(`/branches/${newBranchId}`);
          } else {
            navigate('/branches');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update branch' : 'Failed to create branch');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/branches');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh branch data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchBranch();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchBranch();
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
        <a href="/branches">
          <span>Branches</span>
        </a>
      ),
    },
    ...(isEdit && branch
      ? [
          {
            title: <span>{branch.branchName || 'Branch'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Branch</span>,
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
  if (!hasPermission('branches', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} branches.</p>
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
              {isEdit ? `Edit Branch: ${branch?.branchName || ''}` : 'Create New Branch'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update branch details and contact information'
                : 'Create a new branch location'
              }
            </p>
          </div>
          {isEdit && branch && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={branch.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="branch"
                  resourceId={id}
                  currentStatus={branch.status}
                  createdBy={branch.createdBy?._id || branch.createdBy}
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
          {isEdit && branch ? (
            <WorkflowStatusGuard
              status={branch.status}
              resourceType="branch"
              resourceId={id}
              createdBy={branch.createdBy?._id || branch.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <BranchForm
                initialValues={branch || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <BranchForm
              initialValues={branch || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && branch && (
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
                        navigate(`/versions/branch/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="branch"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('branch', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchBranch();
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

export default BranchEditor;

