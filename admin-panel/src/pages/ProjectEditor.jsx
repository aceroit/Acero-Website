import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ProjectForm from '../components/forms/ProjectForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as projectService from '../services/projectService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const ProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: project?.status || 'draft',
    resourceType: 'project',
    createdBy: project?.createdBy?._id || project?.createdBy,
  });

  // Fetch project data if editing
  useEffect(() => {
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    setFetching(true);
    try {
      const response = await projectService.getProject(id);
      if (response.success) {
        setProject(response.data.project);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch project');
      navigate('/projects');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this project');
          setLoading(false);
          return;
        }
        
        response = await projectService.updateProject(id, values);
      } else {
        response = await projectService.createProject(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Project updated successfully' : 'Project created successfully');
        
        if (isEdit) {
          // After updating, refresh the project data
          await fetchProject();
        } else {
          // After creating, redirect to the edit page
          const newProjectId = response.data?.project?._id || response.data?.project?.id;
          if (newProjectId) {
            navigate(`/projects/${newProjectId}`);
          } else {
            navigate('/projects');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update project' : 'Failed to create project');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh project data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchProject();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchProject();
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
        <a href="/projects">
          <span>Projects</span>
        </a>
      ),
    },
    ...(isEdit && project
      ? [
          {
            title: <span>{project.jobNumber || 'Project'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Project</span>,
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
  if (!hasPermission('projects', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} projects.</p>
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
              {isEdit ? `Edit Project: ${project?.jobNumber || ''}` : 'Create New Project'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update project details and metadata'
                : 'Create a new project for your website'
              }
            </p>
          </div>
          {isEdit && project && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={project.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="project"
                  resourceId={id}
                  currentStatus={project.status}
                  createdBy={project.createdBy?._id || project.createdBy}
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
          {isEdit && project ? (
            <WorkflowStatusGuard
              status={project.status}
              resourceType="project"
              resourceId={id}
              createdBy={project.createdBy?._id || project.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <ProjectForm
                initialValues={project || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <ProjectForm
              initialValues={project || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && project && (
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
                        navigate(`/versions/project/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="project"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('project', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchProject();
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

export default ProjectEditor;

