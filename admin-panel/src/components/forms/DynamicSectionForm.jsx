import { Form, Input, InputNumber, Select, Switch, DatePicker, ColorPicker, Upload, Button , Space} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  MinusCircleOutlined,
  PictureOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import HeroCarouselSlidesEditor from './HeroCarouselSlidesEditor';
import ContentWithImageEditor from './ContentWithImageEditor';
import StatisticsEditor from './StatisticsEditor';
import InfiniteCarouselEditor from './InfiniteCarouselEditor';
import ProjectsGridEditor from './ProjectsGridEditor';
import CompanyUpdatesEditor from './CompanyUpdatesEditor';
// New Who We Are page editors
import HeroImageEditor from './section-editors/HeroImageEditor';
import PremiumVideoEditor from './section-editors/PremiumVideoEditor';
import ImageGalleryEditor from './section-editors/ImageGalleryEditor';
import FeaturesGridEditor from './section-editors/FeaturesGridEditor';
// Product page editors
import ProductCardEditor from './section-editors/ProductCardEditor';
import ImageModalGalleryEditor from './section-editors/ImageModalGalleryEditor';
import ApplicationCardsEditor from './section-editors/ApplicationCardsEditor';
import CircularAdvantagesEditor from './section-editors/CircularAdvantagesEditor';
import ImageDisplayEditor from './section-editors/ImageDisplayEditor';
import FlipCardEditor from './section-editors/FlipCardEditor';
import ComparisonTableEditor from './section-editors/ComparisonTableEditor';
import TabbedComparisonEditor from './section-editors/TabbedComparisonEditor';
import AdvantagesGridEditor from './section-editors/AdvantagesGridEditor';
import HoverCardEditor from './section-editors/HoverCardEditor';
import CertificatesGridEditor from './section-editors/CertificatesGridEditor';
import VideoCardsEditor from './section-editors/VideoCardsEditor';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Dynamic Section Form Component
 * Renders form fields dynamically based on section type field schema
 */
const DynamicSectionForm = ({
  sectionType,
  initialContent = {},
  form,
  loading = false,
}) => {
  // Sort fields by order
  const sortedFields = sectionType?.fields
    ? [...sectionType.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Render field based on type
  const renderField = (field) => {
    const fieldName = field.name;
    const fieldValue = initialContent[fieldName] ?? field.defaultValue ?? null;

    // Common form item props
    const formItemProps = {
      name: ['content', fieldName],
      label: field.label,
      tooltip: field.helpText || undefined,
      required: field.required || false,
      initialValue: fieldValue,
    };

    // Add validation rules
    const rules = [];
    if (field.required) {
      rules.push({ required: true, message: `${field.label} is required` });
    }
    if (field.validation) {
      if (field.validation.minLength) {
        rules.push({ 
          min: field.validation.minLength, 
          message: `${field.label} must be at least ${field.validation.minLength} characters` 
        });
      }
      if (field.validation.maxLength) {
        rules.push({ 
          max: field.validation.maxLength, 
          message: `${field.label} must not exceed ${field.validation.maxLength} characters` 
        });
      }
      if (field.validation.pattern) {
        rules.push({ 
          pattern: new RegExp(field.validation.pattern), 
          message: `${field.label} format is invalid` 
        });
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
              maxLength={field.validation?.maxLength}
            />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              rows={4}
              size="large"
              maxLength={field.validation?.maxLength}
              showCount={field.validation?.maxLength ? true : false}
            />
          </Form.Item>
        );

      case 'array':
        // Special handling for content_with_image paragraphs field
        if (sectionType?.slug === 'content_with_image' && fieldName === 'paragraphs') {
          // This will be handled by ContentWithImageEditor
          return null;
        }
        
        // Default array field handling (for other section types)
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Form.List name={['content', fieldName]} initialValue={fieldValue || []}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name]}
                        rules={[{ required: true, message: 'Item is required' }]}
                      >
                        <Input placeholder="Enter item" size="large" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      size="large"
                    >
                      Add Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        );

      case 'richtext':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} (HTML supported)`}
              rows={8}
              size="large"
              maxLength={field.validation?.maxLength}
              showCount={field.validation?.maxLength ? true : false}
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'number', message: `${field.label} must be a number` },
            ]}
          >
            <InputNumber
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </Form.Item>
        );

      case 'email':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'email', message: `${field.label} must be a valid email` },
            ]}
          >
            <Input
              type="email"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'url':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'url', message: `${field.label} must be a valid URL` },
            ]}
          >
            <Input
              type="url"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'tel':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              type="tel"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueProps={(value) => ({
              value: value ? dayjs(value) : null,
            })}
            normalize={(value) => {
              if (!value) return null;
              return value.format('YYYY-MM-DD');
            }}
          >
            <DatePicker
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        );

      case 'datetime':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueProps={(value) => ({
              value: value ? dayjs(value) : null,
            })}
            normalize={(value) => {
              if (!value) return null;
              return value.format('YYYY-MM-DD HH:mm:ss');
            }}
          >
            <DatePicker
              showTime
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
        );

      case 'time':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              type="time"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item
            {...formItemProps}
            valuePropName="checked"
            rules={rules}
          >
            <Switch />
          </Form.Item>
        );

      case 'color':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker
              showText
              format="hex"
              size="large"
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'multiselect':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              mode="multiple"
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'radio':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'checkbox':
        return (
          <Form.Item
            {...formItemProps}
            valuePropName="checked"
            rules={rules}
          >
            <Switch />
          </Form.Item>
        );

      case 'image':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false} // Prevent auto upload
              accept="image/*"
            >
              <div>
                <PictureOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        );

      case 'file':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              beforeUpload={() => false} // Prevent auto upload
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </Form.Item>
        );

      case 'json':
        // Special handling for hero_carousel slides field
        if (sectionType?.slug === 'hero_carousel' && fieldName === 'slides') {
          return (
            <Form.Item
              {...formItemProps}
              rules={[
                ...rules,
                {
                  validator: (_, value) => {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                      if (field.required) {
                        return Promise.reject(new Error(`${field.label} is required`));
                      }
                      return Promise.resolve();
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <HeroCarouselSlidesEditor
                value={fieldValue || []}
                onChange={(newSlides) => {
                  form.setFieldsValue({
                    content: {
                      ...form.getFieldValue('content'),
                      slides: newSlides,
                    },
                  });
                }}
                form={form}
              />
            </Form.Item>
          );
        }
        
        // Special handling for statistics stats field
        if (sectionType?.slug === 'statistics' && fieldName === 'stats') {
          // This will be handled by StatisticsEditor
          return null;
        }
        
        // Special handling for infinite_carousel items field
        if (sectionType?.slug === 'infinite_carousel' && fieldName === 'items') {
          // This will be handled by InfiniteCarouselEditor
          return null;
        }
        
        // Special handling for projects_grid projects field
        if (sectionType?.slug === 'projects_grid' && fieldName === 'projects') {
          // This will be handled by ProjectsGridEditor
          return null;
        }
        
        // Special handling for company_updates updates field
        if (sectionType?.slug === 'company_updates' && fieldName === 'updates') {
          // This will be handled by CompanyUpdatesEditor
          return null;
        }
        
        // Special handling for image_gallery images field
        if (sectionType?.slug === 'image_gallery' && fieldName === 'images') {
          // This will be handled by ImageGalleryEditor
          return null;
        }
        
        // Special handling for features_grid features field
        if (sectionType?.slug === 'features_grid' && fieldName === 'features') {
          // This will be handled by FeaturesGridEditor
          return null;
        }
        
        // Special handling for product_card cta field
        if (sectionType?.slug === 'product_card' && fieldName === 'cta') {
          // This will be handled by ProductCardEditor
          return null;
        }
        
        // Special handling for image_modal_gallery items field
        if (sectionType?.slug === 'image_modal_gallery' && fieldName === 'items') {
          // This will be handled by ImageModalGalleryEditor
          return null;
        }
        
        // Special handling for application_cards applications field
        if (sectionType?.slug === 'application_cards' && fieldName === 'applications') {
          // This will be handled by ApplicationCardsEditor
          return null;
        }
        
        // Special handling for circular_advantages advantages field
        if (sectionType?.slug === 'circular_advantages' && fieldName === 'advantages') {
          // This will be handled by CircularAdvantagesEditor
          return null;
        }
        
        // Special handling for flip_card cards field
        if (sectionType?.slug === 'flip_card' && fieldName === 'cards') {
          // This will be handled by FlipCardEditor
          return null;
        }
        
        // Special handling for comparison_table systems field
        if (sectionType?.slug === 'comparison_table' && fieldName === 'systems') {
          // This will be handled by ComparisonTableEditor
          return null;
        }
        
        // Special handling for tabbed_comparison tabs field
        if (sectionType?.slug === 'tabbed_comparison' && fieldName === 'tabs') {
          // This will be handled by TabbedComparisonEditor
          return null;
        }
        
        // Special handling for advantages_grid advantages field
        if (sectionType?.slug === 'advantages_grid' && fieldName === 'advantages') {
          // This will be handled by AdvantagesGridEditor
          return null;
        }
        
        // Special handling for hover_card cards field
        if (sectionType?.slug === 'hover_card' && fieldName === 'cards') {
          // This will be handled by HoverCardEditor
          return null;
        }
        
        // Default JSON field (textarea)
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              {
                validator: (_, value) => {
                  if (!value) {
                    if (field.required) {
                      return Promise.reject(new Error(`${field.label} is required`));
                    }
                    return Promise.resolve();
                  }
                  try {
                    if (typeof value === 'string') {
                      JSON.parse(value);
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(`${field.label} must be valid JSON`));
                  }
                },
              },
            ]}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} as JSON`}
              rows={6}
              size="large"
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );
    }
  };

  if (!sectionType || !sectionType.fields || sectionType.fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No fields defined for this section type.</p>
      </div>
    );
  }

  // Special handling for content_with_image section type - use custom editor
  if (sectionType.slug === 'content_with_image') {
    return (
      <ContentWithImageEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for statistics section type - use custom editor
  if (sectionType.slug === 'statistics') {
    return (
      <StatisticsEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for infinite_carousel section type - use custom editor
  if (sectionType.slug === 'infinite_carousel') {
    return (
      <InfiniteCarouselEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for projects_grid section type - use custom editor
  if (sectionType.slug === 'projects_grid') {
    return (
      <ProjectsGridEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for company_updates section type - use custom editor
  if (sectionType.slug === 'company_updates') {
    return (
      <CompanyUpdatesEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for hero_image section type - use custom editor
  if (sectionType.slug === 'hero_image') {
    return (
      <HeroImageEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for premium_video section type - use custom editor
  if (sectionType.slug === 'premium_video') {
    return (
      <PremiumVideoEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for image_gallery section type - use custom editor
  if (sectionType.slug === 'image_gallery') {
    return (
      <ImageGalleryEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for features_grid section type - use custom editor
  if (sectionType.slug === 'features_grid') {
    return (
      <FeaturesGridEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for product_card section type - use custom editor
  if (sectionType.slug === 'product_card') {
    return (
      <ProductCardEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for image_modal_gallery section type - use custom editor
  if (sectionType.slug === 'image_modal_gallery') {
    return (
      <ImageModalGalleryEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for application_cards section type - use custom editor
  if (sectionType.slug === 'application_cards') {
    return (
      <ApplicationCardsEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for circular_advantages section type - use custom editor
  if (sectionType.slug === 'circular_advantages') {
    return (
      <CircularAdvantagesEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for image_display section type - use custom editor
  if (sectionType.slug === 'image_display') {
    return (
      <ImageDisplayEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for flip_card section type - use custom editor
  if (sectionType.slug === 'flip_card') {
    return (
      <FlipCardEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for comparison_table section type - use custom editor
  if (sectionType.slug === 'comparison_table') {
    return (
      <ComparisonTableEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for tabbed_comparison section type - use custom editor
  if (sectionType.slug === 'tabbed_comparison') {
    return (
      <TabbedComparisonEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for advantages_grid section type - use custom editor
  if (sectionType.slug === 'advantages_grid') {
    return (
      <AdvantagesGridEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for hover_card section type - use custom editor
  if (sectionType.slug === 'hover_card') {
    return (
      <HoverCardEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for certificates_grid section type - use custom editor with Certifications master
  if (sectionType.slug === 'certificates_grid') {
    return (
      <CertificatesGridEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  // Special handling for video_cards section type - YouTube links/IDs, grid on frontend
  if (sectionType.slug === 'video_cards') {
    return (
      <VideoCardsEditor
        value={initialContent}
        onChange={(newContent) => {
          form.setFieldsValue({
            content: newContent,
          });
        }}
        form={form}
      />
    );
  }

  return (
    <div className="space-y-6">
      {sortedFields.map((field) => {
        const renderedField = renderField(field);
        // Skip null fields (handled by custom editors)
        if (renderedField === null) return null;
        return (
          <div key={field.name}>
            {renderedField}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicSectionForm;

