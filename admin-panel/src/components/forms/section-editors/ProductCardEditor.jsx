import { Card, Button, Input, Select, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';
import './ProductCardEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Product Card Editor Component
 * Custom editor for product card sections with image, title, paragraphs, and CTA
 */
const ProductCardEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="product-card-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Product Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Pre-Engineered Buildings"
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
            Add multiple paragraphs to describe the product. Each paragraph will be displayed as a separate block.
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
                            <TextArea
                              placeholder="Enter paragraph text..."
                              rows={4}
                              size="large"
                              maxLength={1000}
                              showCount
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
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Product Image</h3>
          <div className="space-y-4">
            <Form.Item
              name={['content', 'image']}
              label="Image"
              tooltip="Product image to display"
              rules={[{ required: true, message: 'Product image is required' }]}
              valuePropName="value"
              getValueFromEvent={(imageData) => {
                return imageData?.url || '';
              }}
              getValueProps={(value) => {
                return {
                  value: value ? { url: value } : null
                };
              }}
            >
              <ImageUpload
                folder="products"
                label=""
                maxSize={10}
              />
            </Form.Item>

            <Form.Item
              name={['content', 'imageAlt']}
              label="Image Alt Text"
              tooltip="Alternative text for the image (for accessibility)"
              rules={[{ required: true, message: 'Image alt text is required' }]}
            >
              <Input
                placeholder="e.g., Pre-Engineered Building"
                size="large"
                maxLength={200}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Layout */}
        <Form.Item
          name={['content', 'layout']}
          label="Image Layout"
          tooltip="Position of the image relative to content"
          initialValue="image-right"
        >
          <Select size="large" placeholder="Select layout">
            <Option value="image-right">Image Right</Option>
            <Option value="image-left">Image Left</Option>
          </Select>
        </Form.Item>

        {/* Call to Action (CTA) - Required */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Call to Action <span className="text-red-500">*</span></h3>
          <p className="text-xs text-gray-500 mb-4">
            Add a button with a link to encourage user action (required for product cards)
          </p>
          <div className="space-y-4">
            <Form.Item
              name={['content', 'cta', 'label']}
              label="Button Label"
              tooltip="Text displayed on the button"
              rules={[{ required: true, message: 'Button label is required' }]}
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
              rules={[{ required: true, message: 'Button link is required' }]}
            >
              <Input
                placeholder="e.g., /products/peb or https://example.com"
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

export default ProductCardEditor;

