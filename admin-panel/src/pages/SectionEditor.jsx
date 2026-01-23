import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Breadcrumb, 
  Spin, 
  Form, 
  Select, 
  Button, 
  Switch, 
  Input,
  Space,
  Alert,
  Collapse
} from 'antd';
import { 
  HomeOutlined, 
  FileTextOutlined,
  ArrowLeftOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import DynamicSectionForm from '../components/forms/DynamicSectionForm';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline } from '../components/workflow';
import * as sectionService from '../services/sectionService';
import * as sectionTypeService from '../services/sectionTypeService';
import * as pageService from '../services/pageService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;

const SectionEditor = () => {
  const { pageId, sectionId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!sectionId;
  
  const [section, setSection] = useState(null);
  const [page, setPage] = useState(null);
  const [sectionTypes, setSectionTypes] = useState([]);
  const [selectedSectionType, setSelectedSectionType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fetchingTypes, setFetchingTypes] = useState(true);

  // Fetch section types
  useEffect(() => {
    fetchSectionTypes();
  }, []);

  // Fetch section data if editing
  useEffect(() => {
    if (isEdit && sectionId) {
      fetchSection();
    }
  }, [sectionId]);

  // Fetch page info
  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const response = await pageService.getPageById(pageId);
      if (response.success) {
        setPage(response.data.page);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
    }
  };

  const fetchSectionTypes = async () => {
    setFetchingTypes(true);
    try {
      const response = await sectionTypeService.getActiveSectionTypes();
      if (response.success) {
        let types = response.data.sectionTypes || response.data || [];
        
        // If sectionTypes is an object (grouped by category), flatten it
        if (types && typeof types === 'object' && !Array.isArray(types)) {
          types = Object.values(types).flat();
        }
        
        // Ensure it's an array
        setSectionTypes(Array.isArray(types) ? types : []);
      }
    } catch (error) {
      toast.error('Failed to load section types');
      setSectionTypes([]);
    } finally {
      setFetchingTypes(false);
    }
  };

  const fetchSection = async () => {
    setFetching(true);
    try {
      const response = await sectionService.getSectionById(sectionId);
      if (response.success) {
        const sectionData = response.data.section || response.data;
        setSection(sectionData);
        
        // Set selected section type
        if (sectionData.sectionTypeSlug) {
          const sectionType = sectionTypes.find(
            st => st.slug === sectionData.sectionTypeSlug
          );
          if (sectionType) {
            setSelectedSectionType(sectionType);
          } else {
            // Fetch section type if not in list
            try {
              const typeResponse = await sectionTypeService.getSectionTypeBySlug(
                sectionData.sectionTypeSlug
              );
              if (typeResponse.success) {
                setSelectedSectionType(
                  typeResponse.data.sectionType || typeResponse.data
                );
              }
            } catch (err) {
              console.error('Failed to fetch section type:', err);
            }
          }
        }

        // Set form values
        form.setFieldsValue({
          sectionTypeSlug: sectionData.sectionTypeSlug,
          content: sectionData.content || {},
          isVisible: sectionData.isVisible !== undefined ? sectionData.isVisible : true,
          cssClasses: sectionData.cssClasses || '',
        });
      } else {
        toast.error('Section not found');
        navigate(`/pages/${pageId}/sections`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch section');
      navigate(`/pages/${pageId}/sections`);
    } finally {
      setFetching(false);
    }
  };

  // Handle section type selection
  const handleSectionTypeChange = (slug) => {
    const sectionType = sectionTypes.find(st => st.slug === slug);
    setSelectedSectionType(sectionType || null);
    
    // Reset content when changing section type
    if (!isEdit) {
      form.setFieldsValue({ content: {} });
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const sectionData = {
        sectionTypeSlug: values.sectionTypeSlug,
        content: values.content || {},
        isVisible: values.isVisible !== undefined ? values.isVisible : true,
        cssClasses: values.cssClasses?.trim() || '',
      };

      let response;
      if (isEdit) {
        // Check if section is published - prevent direct edits
        if (section?.status === 'published') {
          toast.error('Cannot edit published content. Please unpublish first or use workflow actions.');
          setLoading(false);
          return;
        }
        
        response = await sectionService.updateSection(sectionId, sectionData);
      } else {
        response = await sectionService.createSection(pageId, sectionData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Section updated successfully' : 'Section created successfully');
        navigate(`/pages/${pageId}/sections`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update section' : 'Failed to create section');
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          toast.error(validationErrors.join(', '));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/pages/${pageId}/sections`);
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh section data to get updated status
    if (isEdit) {
      await fetchSection();
      // Small delay to ensure backend has processed the status change
      setTimeout(() => {
        fetchSection();
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
    {
      title: (
        <a href={`/pages/${pageId}/sections`}>
          <span>Sections</span>
        </a>
      ),
    },
    {
      title: <span>{isEdit ? 'Edit Section' : 'Create Section'}</span>,
    },
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
  if (!hasPermission('sections', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">
              You don't have permission to {isEdit ? 'edit' : 'create'} sections.
            </p>
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
          <div className="flex items-center gap-4 flex-1">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleCancel}
              size="large"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                {isEdit ? `Edit Section` : 'Create New Section'}
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                {isEdit 
                  ? 'Update section content and settings'
                  : 'Add a new section to this page'
                }
                {page && ` - ${page.title}`}
              </p>
            </div>
          </div>
          {isEdit && section && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={section.status} size="large" />
              <WorkflowActions
                resource="section"
                resourceId={sectionId}
                currentStatus={section.status}
                createdBy={section.createdBy?._id || section.createdBy}
                onActionComplete={handleWorkflowActionComplete}
                showLabels={false}
                size="middle"
              />
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              isVisible: true,
              cssClasses: '',
            }}
          >
            {/* Section Type Selection (only when creating) */}
            {!isEdit && (
              <Form.Item
                name="sectionTypeSlug"
                label="Section Type"
                rules={[{ required: true, message: 'Please select a section type' }]}
                tooltip="Choose the type of section you want to create"
              >
                <Select
                  placeholder="Select section type"
                  size="large"
                  loading={fetchingTypes}
                  onChange={handleSectionTypeChange}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={Array.isArray(sectionTypes) ? sectionTypes.map(st => ({
                    value: st.slug,
                    label: `${st.name} (${st.category})`,
                    title: st.description,
                  })) : []}
                />
              </Form.Item>
            )}

            {/* Show selected section type info */}
            {selectedSectionType && (
              <Alert
                title={selectedSectionType.name}
                description={selectedSectionType.description || 'No description available'}
                type="info"
                showIcon
                className="mb-6"
              />
            )}

            {/* Dynamic Form Fields */}
            {selectedSectionType ? (
              <DynamicSectionForm
                sectionType={selectedSectionType}
                initialContent={section?.content || {}}
                form={form}
                loading={loading}
              />
            ) : isEdit ? (
              <Spin />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Please select a section type to continue
                </p>
              </div>
            )}

            {/* Additional Settings */}
            {selectedSectionType && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
                
                <Form.Item
                  name="isVisible"
                  label="Visibility"
                  valuePropName="checked"
                  tooltip="Show or hide this section on the page"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="cssClasses"
                  label="CSS Classes"
                  tooltip="Add custom CSS classes for styling (space-separated)"
                >
                  <Input
                    placeholder="e.g., my-custom-class another-class"
                    size="large"
                  />
                </Form.Item>
              </div>
            )}

            {/* Form Actions */}
            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={handleCancel} 
                  disabled={loading}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  disabled={!selectedSectionType}
                  className="text-white"
                  style={{ 
                    backgroundColor: '#1f2937', 
                    borderColor: '#1f2937',
                    color: '#ffffff',
                    fontWeight: '600'
                  }}
                >
                  {isEdit ? 'Update Section' : 'Create Section'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && section && (
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
                        navigate(`/versions/section/${sectionId}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="section"
                      resourceId={sectionId}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('section', sectionId, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchSection();
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

export default SectionEditor;

