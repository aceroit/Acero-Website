import { Card, Button, Input, Select, Space, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import SimpleRichTextEditor from '../common/SimpleRichTextEditor';
import './ContentWithImageEditor.css';

const { Option } = Select;

/**
 * Content with Image Editor Component
 * Custom editor for content sections with image, paragraphs, and CTA
 */
const ContentWithImageEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="content-with-image-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Complete Steel Building Solutions"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Paragraphs */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Content Paragraphs <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add multiple paragraphs to your content section. Each paragraph will be displayed as a separate block.
          </p>
          <Form.List name={['content', 'paragraphs']} initialValue={value.paragraphs || ['']}>
            {(fields, { add, remove }) => {
              return (
                <div className="paragraphs-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No paragraphs added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add('')}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Paragraph
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card
                          key={field.key}
                          className="border border-gray-200 shadow-sm bg-white"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                Paragraph {index + 1}
                              </span>
                              {fields.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(field.name)}
                                  size="small"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          }
                        >
                          <Form.Item
                            {...field}
                            name={[field.name]}
                            rules={[{ required: true, message: 'Paragraph text is required' }]}
                          >
                            <SimpleRichTextEditor
                              placeholder="Enter paragraph text..."
                            />
                          </Form.Item>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add('')}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Paragraph
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Image Section */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Image Settings</h3>
          <p className="text-xs text-gray-500 mb-4">
            Recommended size: <strong>1200×800 px (3:2)</strong> so the image fits the column and content height without overlap. Use <strong>Contain</strong> for diagrams/infographics (no cropping); use <strong>Cover</strong> for photos when filling the box is fine.
          </p>
          <div className="space-y-4">
            <Form.Item
              name={['content', 'imageFit']}
              label="Image Fit"
              tooltip="Contain: show full image (no cropping). Cover: fill the box (may crop edges)."
              initialValue="contain"
            >
              <Select size="large" placeholder="Image fit">
                <Option value="contain">Contain (show full image)</Option>
                <Option value="cover">Cover (fill box, may crop)</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name={['content', 'image']}
              label="Image"
              tooltip="Optional image to display alongside content. Use 1200×800 px for best fit."
              valuePropName="value"
              getValueFromEvent={(imageData) => {
                return imageData?.url || '';
              }}
              getValueProps={(val) => {
                return {
                  value: val ? { url: val } : null
                };
              }}
            >
              <ImageUpload
                folder="content"
                label=""
                maxSize={10}
              />
            </Form.Item>

            <Form.Item
              name={['content', 'imageAlt']}
              label="Image Alt Text"
              tooltip="Alternative text for the image (for accessibility)"
            >
              <Input
                placeholder="e.g., Complete Steel Building Solutions"
                size="large"
                maxLength={200}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Additional Images (e.g. for Primary Members - 3 images) */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Images</h3>
          <p className="text-xs text-gray-500 mb-4">
            Add extra images to show in a vertical stack alongside the content. Recommended per image: <strong>1200×500 px</strong> for a perfect fit and no overlap.
          </p>
          <Form.List name={['content', 'images']} initialValue={value.images || []}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card
                    key={field.key}
                    size="small"
                    className="border border-gray-200 shadow-sm bg-white mb-4"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Image {field.name + 1}</span>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          size="small"
                        >
                          Remove
                        </Button>
                      </div>
                    }
                  >
                    <Form.Item
                      name={[field.name, 'url']}
                      label="Image URL"
                      valuePropName="value"
                      getValueFromEvent={(imageData) => imageData?.url || ''}
                      getValueProps={(val) => ({ value: val ? { url: val } : null })}
                    >
                      <ImageUpload folder="content" label="" maxSize={10} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'imageAlt']} label="Image Alt Text">
                      <Input placeholder="Alt text for accessibility" size="large" maxLength={200} />
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ url: '', imageAlt: '' })}
                  block
                  size="large"
                >
                  Add Image
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Layout and Variant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name={['content', 'layout']}
            label="Image Layout"
            tooltip="Position of the image relative to content"
            initialValue="image-right"
          >
            <Select size="large" placeholder="Select layout">
              <Option value="image-right">Image Right</Option>
              <Option value="image-left">Image Left</Option>
              <Option value="image-center">Image Center</Option>
              <Option value="text-only">Text Only</Option>
              <Option value="split">Split</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={['content', 'variant']}
            label="Section Variant"
            tooltip="Visual style variant for the section"
            initialValue="default"
          >
            <Select size="large" placeholder="Select variant">
              <Option value="default">Default</Option>
              <Option value="accent">Accent</Option>
              <Option value="muted">Muted</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Call to Action (CTA) */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Call to Action (Optional)</h3>
          <p className="text-xs text-gray-500 mb-4">
            Add a button with a link to encourage user action
          </p>
          <div className="space-y-4">
            <Form.Item
              name={['content', 'cta', 'label']}
              label="Button Label"
              tooltip="Text displayed on the button"
            >
              <Input
                placeholder="e.g., Learn More"
                size="large"
                maxLength={50}
              />
            </Form.Item>

            <Form.Item
              name={['content', 'cta', 'href']}
              label="Button Link"
              tooltip="URL or path the button should link to"
              rules={[
                {
                  validator: (_, value) => {
                    const ctaLabel = form.getFieldValue(['content', 'cta', 'label']);
                    if (ctaLabel && !value) {
                      return Promise.reject(new Error('Link is required when button label is provided'));
                    }
                    if (value && !ctaLabel) {
                      return Promise.reject(new Error('Button label is required when link is provided'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                placeholder="e.g., /products or https://example.com"
                size="large"
                maxLength={500}
              />
            </Form.Item>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContentWithImageEditor;

