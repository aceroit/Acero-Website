import { Form, Input, Select, Button, Switch, DatePicker } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import * as companyUpdateCategoryService from '../../services/companyUpdateCategoryService';
import ImageUpload from '../common/ImageUpload';
import GalleryUpload from '../common/GalleryUpload';
import LinkedInPostFormItem from './LinkedInPostFormItem';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Company Update Form Component
 * Reusable form for creating and editing company updates
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const CompanyUpdateForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (initialValues) {
      let eventDateValue = null;
      if (initialValues.eventDate) {
        if (dayjs.isDayjs(initialValues.eventDate)) {
          eventDateValue = initialValues.eventDate;
        } else if (typeof initialValues.eventDate === 'string') {
          const dayjsValue = dayjs(initialValues.eventDate);
          eventDateValue = dayjsValue.isValid() ? dayjsValue : null;
        } else if (initialValues.eventDate instanceof Date) {
          const dayjsValue = dayjs(initialValues.eventDate);
          eventDateValue = dayjsValue.isValid() ? dayjsValue : null;
        }
      }
      
      const formValues = {
        ...initialValues,
        category: initialValues.category?._id || initialValues.category,
        eventDate: eventDateValue,
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        showOnHomePage: initialValues.showOnHomePage !== undefined ? initialValues.showOnHomePage : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
        gallery: initialValues.gallery || [],
        linkedInPosts: initialValues.linkedInPosts || [],
        metaKeywords: Array.isArray(initialValues.metaKeywords) 
          ? initialValues.metaKeywords.join(', ') 
          : initialValues.metaKeywords || '',
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      // Filter by published status and active for dropdowns
      const response = await companyUpdateCategoryService.getAllCompanyUpdateCategories({ 
        isActive: true,
        status: 'published'
      });
      if (response.success) {
        setCategories(response.data.categories || response.data.companyUpdateCategories || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!isEdit && title) {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      form.setFieldsValue({ slug });
    }
  };

  const handleSubmit = async (values) => {
    // Convert metaKeywords string to array
    let metaKeywords = [];
    if (values.metaKeywords) {
      if (typeof values.metaKeywords === 'string') {
        metaKeywords = values.metaKeywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      } else if (Array.isArray(values.metaKeywords)) {
        metaKeywords = values.metaKeywords;
      }
    }

    // Process LinkedIn posts
    let linkedInPosts = [];
    if (values.linkedInPosts && Array.isArray(values.linkedInPosts)) {
      linkedInPosts = values.linkedInPosts.map((post, index) => {
        // Convert hashtags string to array if needed
        let hashtags = [];
        if (post.hashtags) {
          if (typeof post.hashtags === 'string') {
            hashtags = post.hashtags.split(',').map(t => t.trim()).filter(t => t);
          } else if (Array.isArray(post.hashtags)) {
            hashtags = post.hashtags;
          }
        }
        
        return {
          ...post,
          companyName: post.companyName?.trim() || 'Acero Building Systems',
          date: post.date?.trim() || '',
          text: post.text?.trim() || '',
          imageUrl: post.imageUrl?.trim() || null,
          videoUrl: post.videoUrl?.trim() || null,
          videoThumbnail: post.videoThumbnail?.trim() || null,
          hashtags: hashtags,
          order: post.order !== undefined ? post.order : index,
          likes: parseInt(post.likes) || 0,
          comments: parseInt(post.comments) || 0,
          isVideo: post.isVideo || false,
          publishedAt: post.publishedAt || null
        };
      });
    }

    const cleanedValues = {
      ...values,
      eventDate: values.eventDate ? values.eventDate.toISOString() : null,
      shortDescription: values.shortDescription?.trim() || null,
      description: values.description?.trim() || null,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      metaKeywords: metaKeywords,
      linkedInPosts: linkedInPosts,
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
        featured: false,
        showOnHomePage: false,
        isActive: true,
        gallery: [],
        linkedInPosts: [],
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Please enter title' },
            { min: 2, message: 'Title must be at least 2 characters' },
            { max: 200, message: 'Title must not exceed 200 characters' },
          ]}
        >
          <Input
            placeholder="Enter title"
            size="large"
            onChange={handleTitleChange}
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Please enter slug' },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug must contain only lowercase letters, numbers, and hyphens'
              },
            ]}
            tooltip="URL-friendly identifier (auto-generated from title)"
          >
            <Input
              placeholder="Enter slug"
              size="large"
              disabled={isEdit}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select
              placeholder="Select category"
              size="large"
              loading={loadingCategories}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={categories.map(cat => ({
                value: cat._id,
                label: cat.name,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="heading"
          label="Heading"
          rules={[
            { required: true, message: 'Please enter heading' },
            { min: 2, message: 'Heading must be at least 2 characters' },
          ]}
        >
          <Input
            placeholder="Enter heading"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="shortDescription"
          label="Short Description"
          tooltip="Brief summary or excerpt"
        >
          <TextArea
            placeholder="Enter short description"
            size="large"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          tooltip="Full content description"
        >
          <TextArea
            placeholder="Enter full description"
            size="large"
            rows={6}
          />
        </Form.Item>

        <Form.Item
          name="eventDate"
          label="Event Date"
          tooltip="Date of the event or update (optional)"
          getValueProps={(value) => {
            if (!value) return { value: null };
            // If it's already a dayjs object, return as is
            if (dayjs.isDayjs(value)) return { value };
            // If it's a string, convert to dayjs
            if (typeof value === 'string') {
              const dayjsValue = dayjs(value);
              return { value: dayjsValue.isValid() ? dayjsValue : null };
            }
            // If it's a Date object, convert to dayjs
            if (value instanceof Date) {
              const dayjsValue = dayjs(value);
              return { value: dayjsValue.isValid() ? dayjsValue : null };
            }
            return { value: null };
          }}
          normalize={(value) => {
            if (!value) return null;
            if (dayjs.isDayjs(value)) {
              return value;
            }
            return value;
          }}
        >
          <DatePicker
            size="large"
            className="w-full"
            format="YYYY-MM-DD"
            showTime={false}
          />
        </Form.Item>
      </div>

      {/* Images */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Images</h3>
        
        <Form.Item
          name="banner"
          label="Banner Image"
          tooltip="Main banner image (min: 1280×960px)"
        >
          <ImageUpload
            value={form.getFieldValue('banner')}
            onChange={(image) => {
              form.setFieldsValue({ banner: image });
              form.validateFields(['banner']);
            }}
            folder="company-updates/banners"
            dimensions={{ minWidth: 1280, minHeight: 960 }}
            maxSize={10}
          />
        </Form.Item>

        <Form.Item
          name="featureImage"
          label="Feature Image"
          tooltip="Feature image for the update (min: 550×444px)"
        >
          <ImageUpload
            value={form.getFieldValue('featureImage')}
            onChange={(image) => {
              form.setFieldsValue({ featureImage: image });
              form.validateFields(['featureImage']);
            }}
            folder="company-updates/features"
            dimensions={{ minWidth: 550, minHeight: 444 }}
            maxSize={10}
          />
        </Form.Item>

        <Form.Item
          name="gallery"
          label="Gallery Images"
          tooltip="Additional images for the update (min: 550×500px each)"
        >
          <GalleryUpload
            value={form.getFieldValue('gallery') || []}
            onChange={(gallery) => {
              form.setFieldsValue({ gallery });
              form.validateFields(['gallery']);
            }}
            folder="company-updates/gallery"
            dimensions={{ minWidth: 550, minHeight: 500 }}
            maxSize={10}
          />
        </Form.Item>
      </div>

      {/* LinkedIn Posts - Optional */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          LinkedIn Posts (Optional)
        </h3>
        <Form.Item
          name="linkedInPosts"
          label="LinkedIn Posts"
          tooltip="Add LinkedIn posts to display alongside this company update"
        >
          <LinkedInPostFormItem />
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
            tooltip="Featured updates are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="showOnHomePage"
            label="Show on home page"
            valuePropName="checked"
            tooltip="Show this update in the home page company updates block (max 3)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive updates are hidden from all views"
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
          tooltip="Comma-separated keywords for SEO (will be converted to array)"
        >
          <Input
            placeholder="keyword1, keyword2, keyword3"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="metaImage"
          label="Meta Image (OG Image)"
          tooltip="Image for social media sharing (150×150px)"
        >
          <ImageUpload
            value={form.getFieldValue('metaImage')}
            onChange={(image) => {
              form.setFieldsValue({ metaImage: image });
              form.validateFields(['metaImage']);
            }}
            folder="company-updates/meta"
            dimensions={{ minWidth: 150, minHeight: 150 }}
            maxSize={5}
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
            {isEdit ? 'Update Company Update' : 'Create Company Update'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default CompanyUpdateForm;

