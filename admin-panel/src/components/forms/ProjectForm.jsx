import { Form, Input, Select, Button, Switch, InputNumber, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import * as referenceService from '../../services/referenceService';
import ImageUpload from '../common/ImageUpload';
import GalleryUpload from '../common/GalleryUpload';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Project Form Component
 * Reusable form for creating and editing projects
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const ProjectForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState({
    buildingTypes: false,
    countries: false,
    regions: false,
    areas: false,
    industries: false,
  });
  const [specialFeatures, setSpecialFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        buildingType: initialValues.buildingType?._id || initialValues.buildingType,
        country: initialValues.country?._id || initialValues.country,
        region: initialValues.region?._id || initialValues.region,
        area: initialValues.area?._id || initialValues.area,
        industry: initialValues.industry?._id || initialValues.industry,
        specialFeatures: initialValues.specialFeatures || [],
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        showOnHomePage: initialValues.showOnHomePage !== undefined ? initialValues.showOnHomePage : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      };
      form.setFieldsValue(formValues);
      setSpecialFeatures(initialValues.specialFeatures || []);
    }
  }, [initialValues, form]);

  // Fetch all dropdown options
  useEffect(() => {
    fetchBuildingTypes();
    fetchCountries();
    fetchIndustries();
  }, []);

  // Fetch regions when country changes
  useEffect(() => {
    const country = form.getFieldValue('country');
    if (country) {
      fetchRegions(country);
    } else {
      setRegions([]);
      setAreas([]);
      form.setFieldsValue({ region: undefined, area: undefined });
    }
  }, [form.getFieldValue('country')]);

  // Fetch areas when region changes
  useEffect(() => {
    const region = form.getFieldValue('region');
    if (region) {
      fetchAreas(region);
    } else {
      setAreas([]);
      form.setFieldsValue({ area: undefined });
    }
  }, [form.getFieldValue('region')]);

  const fetchBuildingTypes = async () => {
    setLoadingOptions(prev => ({ ...prev, buildingTypes: true }));
    try {
      const response = await referenceService.getBuildingTypes();
      if (response.success) {
        setBuildingTypes(response.data.buildingTypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch building types:', error);
      toast.error('Failed to load building types');
    } finally {
      setLoadingOptions(prev => ({ ...prev, buildingTypes: false }));
    }
  };

  const fetchCountries = async () => {
    setLoadingOptions(prev => ({ ...prev, countries: true }));
    try {
      const response = await referenceService.getCountries();
      if (response.success) {
        setCountries(response.data.countries || []);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLoadingOptions(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchRegions = async (countryId) => {
    setLoadingOptions(prev => ({ ...prev, regions: true }));
    try {
      const response = await referenceService.getRegions(countryId);
      if (response.success) {
        setRegions(response.data.regions || []);
      }
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      toast.error('Failed to load regions');
    } finally {
      setLoadingOptions(prev => ({ ...prev, regions: false }));
    }
  };

  const fetchAreas = async (regionId) => {
    setLoadingOptions(prev => ({ ...prev, areas: true }));
    try {
      const response = await referenceService.getAreas(regionId);
      if (response.success) {
        setAreas(response.data.areas || []);
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error);
      toast.error('Failed to load areas');
    } finally {
      setLoadingOptions(prev => ({ ...prev, areas: false }));
    }
  };

  const fetchIndustries = async () => {
    setLoadingOptions(prev => ({ ...prev, industries: true }));
    try {
      const response = await referenceService.getIndustries();
      if (response.success) {
        setIndustries(response.data.industries || []);
      }
    } catch (error) {
      console.error('Failed to fetch industries:', error);
      toast.error('Failed to load industries');
    } finally {
      setLoadingOptions(prev => ({ ...prev, industries: false }));
    }
  };

  // Auto-generate slug from job number
  const handleJobNumberChange = (e) => {
    const jobNumber = e.target.value;
    if (!isEdit && jobNumber) {
      const slug = jobNumber
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      form.setFieldsValue({ jobNumberSlug: slug });
    }
  };

  const handleCountryChange = (countryId) => {
    form.setFieldsValue({ region: undefined, area: undefined });
    if (countryId) {
      fetchRegions(countryId);
    }
  };

  const handleRegionChange = (regionId) => {
    form.setFieldsValue({ area: undefined });
    if (regionId) {
      fetchAreas(regionId);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !specialFeatures.includes(newFeature.trim())) {
      const updated = [...specialFeatures, newFeature.trim()];
      setSpecialFeatures(updated);
      form.setFieldsValue({ specialFeatures: updated });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature) => {
    const updated = specialFeatures.filter(f => f !== feature);
    setSpecialFeatures(updated);
    form.setFieldsValue({ specialFeatures: updated });
  };

  const handleSubmit = async (values) => {
    const cleanedValues = {
      ...values,
      specialFeatures: specialFeatures,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      metaKeywords: values.metaKeywords || [],
      totalArea: values.totalArea?.trim() || null,
      featured: values.featured !== undefined ? values.featured : false,
      showOnHomePage: values.showOnHomePage !== undefined ? values.showOnHomePage : false,
      isActive: values.isActive !== undefined ? values.isActive : true,
    };
    await onSubmit(cleanedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        order: 0,
        featured: false,
        showOnHomePage: false,
        isActive: true,
        specialFeatures: [],
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="buildingType"
            label="Building Type"
            rules={[{ required: true, message: 'Please select building type' }]}
          >
            <Select
              placeholder="Select building type"
              size="large"
              loading={loadingOptions.buildingTypes}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={buildingTypes.map(bt => ({
                value: bt._id,
                label: bt.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="jobNumber"
            label="Job Number"
            rules={[
              { required: true, message: 'Please enter job number' },
              { min: 2, message: 'Job number must be at least 2 characters' },
            ]}
          >
            <Input
              placeholder="Enter job number"
              size="large"
              onChange={handleJobNumberChange}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="jobNumberSlug"
            label="Job Number Slug"
            rules={[
              { required: true, message: 'Please enter job number slug' },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug must contain only lowercase letters, numbers, and hyphens'
              },
            ]}
            tooltip="URL-friendly identifier (auto-generated from job number)"
          >
            <Input
              placeholder="Enter job number slug"
              size="large"
              disabled={isEdit}
            />
          </Form.Item>

          <Form.Item
            name="typeSlug"
            label="Type Slug"
            rules={[
              { required: true, message: 'Please enter type slug' },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Type slug must contain only lowercase letters, numbers, and hyphens'
              },
            ]}
          >
            <Input
              placeholder="Enter type slug"
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="order"
          label="Display Order"
          rules={[
            { required: true, message: 'Please enter display order' },
            { type: 'number', min: 0, message: 'Order must be 0 or greater' },
          ]}
          tooltip="Lower numbers appear first"
        >
          <InputNumber
            placeholder="Enter display order"
            size="large"
            min={0}
            className="w-full"
          />
        </Form.Item>
      </div>

      {/* Location Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please select country' }]}
          >
            <Select
              placeholder="Select country"
              size="large"
              loading={loadingOptions.countries}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleCountryChange}
              options={countries.map(c => ({
                value: c._id,
                label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="region"
            label="Region"
            rules={[{ required: true, message: 'Please select region' }]}
          >
            <Select
              placeholder="Select region"
              size="large"
              loading={loadingOptions.regions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleRegionChange}
              disabled={!form.getFieldValue('country')}
              options={regions.map(r => ({
                value: r._id,
                label: `${r.name}${r.code ? ` (${r.code})` : ''}`,
              }))}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="area"
            label="Area"
            rules={[{ required: true, message: 'Please select area' }]}
          >
            <Select
              placeholder="Select area"
              size="large"
              loading={loadingOptions.areas}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              disabled={!form.getFieldValue('region')}
              options={areas.map(a => ({
                value: a._id,
                label: `${a.name}${a.code ? ` (${a.code})` : ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="industry"
            label="Industry"
            rules={[{ required: true, message: 'Please select industry' }]}
          >
            <Select
              placeholder="Select industry"
              size="large"
              loading={loadingOptions.industries}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={industries.map(i => ({
                value: i._id,
                label: i.name,
              }))}
            />
          </Form.Item>
        </div>
      </div>

      {/* Project Details */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        
        <Form.Item
          name="totalArea"
          label="Total Area"
          tooltip="Total area of the project (e.g., '5000 sq ft', '1000 m²')"
        >
          <Input
            placeholder="Enter total area"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="specialFeatures"
          label="Special Features"
          tooltip="Add special features or highlights for this project"
        >
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Enter special feature"
                size="large"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddFeature();
                }}
              />
              <Button
                type="default"
                htmlType="button"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleAddFeature}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialFeatures.map((feature, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveFeature(feature)}
                  className="px-3 py-1 text-sm"
                >
                  {feature}
                </Tag>
              ))}
            </div>
          </div>
        </Form.Item>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured projects appear on the Projects listing page (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="showOnHomePage"
            label="Show on home page"
            valuePropName="checked"
            tooltip="Show this project in the home page projects section (max 6). Featured controls the Projects listing page."
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive projects are hidden from all views"
          >
            <Switch />
          </Form.Item>
        </div>
      </div>

      {/* SEO Metadata */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Metadata</h3>
        
        <Form.Item
          name="metaTitle"
          label="Meta Title"
          tooltip="SEO title (recommended: 50-60 characters)"
        >
          <Input
            placeholder="Enter meta title"
            size="large"
            maxLength={60}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="metaDescription"
          label="Meta Description"
          tooltip="SEO description (recommended: 150-160 characters)"
        >
          <TextArea
            placeholder="Enter meta description"
            size="large"
            rows={3}
            maxLength={160}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="metaKeywords"
          label="Meta Keywords"
          tooltip="Comma-separated keywords for SEO"
        >
          <Input
            placeholder="keyword1, keyword2, keyword3"
            size="large"
          />
        </Form.Item>
      </div>

      {/* Images */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Images</h3>
        
        <Form.Item
          name="thumbnailImage"
          label="Thumbnail Image"
          tooltip="Main thumbnail image for the project (min: 1000×500px)"
        >
          <ImageUpload
            value={form.getFieldValue('thumbnailImage')}
            onChange={(image) => {
              form.setFieldsValue({ thumbnailImage: image });
              form.validateFields(['thumbnailImage']);
            }}
            folder="projects/thumbnails"
            dimensions={{ minWidth: 1000, minHeight: 500 }}
            maxSize={10}
          />
        </Form.Item>

        <Form.Item
          name="projectImages"
          label="Project Gallery Images"
          tooltip="Gallery images for the project (minimum 5 images required, min: 736×368px or 546×273px)"
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.resolve(); // Allow empty on create, validate on publish
                }
                if (value.length < 5) {
                  return Promise.reject(new Error('At least 5 images are required for the gallery'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <GalleryUpload
            value={form.getFieldValue('projectImages') || []}
            onChange={(images) => {
              form.setFieldsValue({ projectImages: images });
              form.validateFields(['projectImages']);
            }}
            folder="projects/gallery"
            label="Upload Project Gallery Images"
            dimensions={{ minWidth: 546, minHeight: 273 }}
            maxSize={10}
          />
        </Form.Item>
      </div>

      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button
            onClick={onCancel}
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
            className="text-white"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              fontWeight: '600'
            }}
          >
            {isEdit ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;

