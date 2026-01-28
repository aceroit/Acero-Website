import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import CountryForm from '../components/forms/CountryForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as countryService from '../services/countryService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const CountryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: country?.status || 'draft',
    resourceType: 'country',
    createdBy: country?.createdBy?._id || country?.createdBy,
  });

  // Fetch country data if editing
  useEffect(() => {
    if (isEdit) {
      fetchCountry();
    }
  }, [id]);

  const fetchCountry = async () => {
    setFetching(true);
    try {
      const response = await countryService.getCountry(id);
      if (response.success) {
        setCountry(response.data.country);
      } else {
        toast.error('Country not found');
        navigate('/countries');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch country');
      navigate('/countries');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this country');
          setLoading(false);
          return;
        }
        
        response = await countryService.updateCountry(id, values);
      } else {
        response = await countryService.createCountry(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Country updated successfully' : 'Country created successfully');
        
        if (isEdit) {
          // After updating, refresh the country data
          await fetchCountry();
        } else {
          // After creating, redirect to the edit page
          const newCountryId = response.data?.country?._id || response.data?.country?.id;
          if (newCountryId) {
            navigate(`/countries/${newCountryId}`);
          } else {
            navigate('/countries');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update country' : 'Failed to create country');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/countries');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh country data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchCountry();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchCountry();
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
        <a href="/countries">
          <span>Countries</span>
        </a>
      ),
    },
    ...(isEdit && country
      ? [
          {
            title: <span>{country.name || 'Country'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Country</span>,
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
  if (!hasPermission('countries', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} countries.</p>
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
              {isEdit ? `Edit Country: ${country?.name || ''}` : 'Create New Country'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update country details'
                : 'Create a new country for location references'
              }
            </p>
          </div>
          {isEdit && country && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={country.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="country"
                  resourceId={id}
                  currentStatus={country.status}
                  createdBy={country.createdBy?._id || country.createdBy}
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
          {isEdit && country ? (
            <WorkflowStatusGuard
              status={country.status}
              resourceType="country"
              resourceId={id}
              createdBy={country.createdBy?._id || country.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <CountryForm
                initialValues={country || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <CountryForm
              initialValues={country || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && country && (
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
                        navigate(`/versions/country/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="country"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('country', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchCountry();
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

export default CountryEditor;

