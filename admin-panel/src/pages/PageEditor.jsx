import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button } from 'antd';
import { HomeOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import PageForm from '../components/forms/PageForm';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline } from '../components/workflow';
import * as pageService from '../services/pageService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [breadcrumb, setBreadcrumb] = useState([]);

  // Fetch page data if editing
  useEffect(() => {
    if (isEdit) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    setFetching(true);
    try {
      const response = await pageService.getPageById(id);
      if (response.success) {
        setPage(response.data.page);
        if (response.data.breadcrumb) {
          setBreadcrumb(response.data.breadcrumb);
        }
      } else {
        toast.error('Page not found');
        navigate('/pages');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch page');
      navigate('/pages');
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
        // Check if page is published - prevent direct edits
        if (page?.status === 'published') {
          toast.error('Cannot edit published content. Please unpublish first or use workflow actions.');
          setLoading(false);
          return;
        }
        
        response = await pageService.updatePage(id, values);
      } else {
        response = await pageService.createPage(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Page updated successfully' : 'Page created successfully');
        navigate('/pages');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update page' : 'Failed to create page');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/pages');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh page data to get updated status
    if (isEdit) {
      await fetchPage();
      // Small delay to ensure backend has processed the status change
      setTimeout(() => {
        fetchPage();
      }, 300);
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
        <a href="/pages">
          <span>Pages</span>
        </a>
      ),
    },
    ...(isEdit && page
      ? [
          {
            title: <span>{page.title}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Page</span>,
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
  if (!hasPermission('pages', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} pages.</p>
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
              {isEdit ? `Edit Page: ${page?.title || ''}` : 'Create New Page'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update page details and metadata'
                : 'Create a new page for your website'
              }
            </p>
          </div>
          {isEdit && page && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={page.status} size="large" />
              <WorkflowActions
                resource="page"
                resourceId={id}
                currentStatus={page.status}
                onActionComplete={handleWorkflowActionComplete}
                showLabels={false}
                size="middle"
              />
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <PageForm
            initialValues={page || {}}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            isEdit={isEdit}
            excludePageId={isEdit ? id : null}
          />
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && page && (
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
                        navigate(`/versions/page/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="page"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('page', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchPage();
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

export default PageEditor;

