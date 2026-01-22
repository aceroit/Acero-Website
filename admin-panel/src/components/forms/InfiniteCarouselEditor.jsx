import { Card, Button, Input, Select, Space, Form, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import './InfiniteCarouselEditor.css';

const { Option } = Select;

/**
 * Infinite Carousel Editor Component
 * Custom editor for infinite scrolling carousel sections (certifications, customers, etc.)
 */
const InfiniteCarouselEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="infinite-carousel-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Optional title displayed above the carousel"
        >
          <Input
            placeholder="e.g., Our Quality Certifications, Our Customers"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Carousel Items */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Carousel Items <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add images/logos to display in the infinite scrolling carousel. Each item will scroll continuously.
          </p>
          <Form.List name={['content', 'items']} initialValue={value.items || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="carousel-items-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No items added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ image: '', alt: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Item
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
                                Item {index + 1}
                              </span>
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
                          <div className="space-y-4">
                            {/* Image */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'image']}
                              label="Image"
                              tooltip="Logo or image to display in the carousel"
                              rules={[{ required: true, message: 'Image is required' }]}
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
                                folder="carousel"
                                label=""
                                maxSize={5}
                              />
                            </Form.Item>

                            {/* Alt Text */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'alt']}
                              label="Alt Text"
                              tooltip="Alternative text for the image (for accessibility and SEO)"
                              rules={[{ required: true, message: 'Alt text is required' }]}
                            >
                              <Input
                                placeholder="e.g., ISO 9001, Customer Logo"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ image: '', alt: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Item
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Carousel Settings */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Carousel Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name={['content', 'speed']}
                label="Scroll Speed"
                tooltip="How fast the carousel scrolls"
                initialValue="medium"
              >
                <Select size="large" placeholder="Select speed">
                  <Option value="slow">Slow</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="fast">Fast</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name={['content', 'direction']}
                label="Scroll Direction"
                tooltip="Direction the carousel scrolls"
                initialValue="left"
              >
                <Select size="large" placeholder="Select direction">
                  <Option value="left">Left</Option>
                  <Option value="right">Right</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name={['content', 'pauseOnHover']}
              label="Pause on Hover"
              tooltip="Pause scrolling when user hovers over the carousel"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch size="default" />
            </Form.Item>

            <Form.Item
              name={['content', 'itemClassName']}
              label="Item CSS Classes"
              tooltip="CSS classes for carousel items (e.g., 'h-20 w-32 md:h-24 md:w-40' for certifications, 'h-16 w-32 md:h-20 md:w-40' for customers)"
            >
              <Input
                placeholder="e.g., h-20 w-32 md:h-24 md:w-40"
                size="large"
                maxLength={200}
              />
            </Form.Item>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InfiniteCarouselEditor;

