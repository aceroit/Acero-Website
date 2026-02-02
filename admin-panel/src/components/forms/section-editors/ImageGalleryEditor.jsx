import { Card, Button, Input, Select, Space, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';
import './ImageGalleryEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Image Gallery Editor Component
 * Custom editor for image gallery sections
 */
const ImageGalleryEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="image-gallery-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Gallery Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Engineering Excellence"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Paragraph */}
        <Form.Item
          name={['content', 'paragraph']}
          label="Description Paragraph"
          tooltip="Optional description text displayed below the title"
        >
          <TextArea
            placeholder="e.g., At Acero Building Systems, we combine global presence with precision-driven processes..."
            rows={4}
            size="large"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        {/* Gallery Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gallery Images <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add images to display in the gallery grid. Each image can have alt text, an optional name label, and an optional link (makes the card clickable).
          </p>
          <Form.List name={['content', 'images']} initialValue={value.images || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="gallery-images-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No images added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ src: '', alt: '', name: '', link: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Image
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
                                Image {index + 1}
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
                              name={[field.name, 'src']}
                              label="Image"
                              tooltip="Image to display in the gallery"
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
                                folder="gallery"
                                label=""
                                maxSize={10}
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
                                placeholder="e.g., Engineering Excellence 1"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Name (optional label below image) */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'name']}
                              label="Name (optional)"
                              tooltip="Label shown below the image (e.g. ISO 9001, QHSE Policy)"
                            >
                              <Input
                                placeholder="e.g., ISO 9001, EN 1090-1"
                                size="large"
                                maxLength={120}
                              />
                            </Form.Item>

                            {/* Link (optional – makes the image card clickable) */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'link']}
                              label="Link (optional)"
                              tooltip="URL to open when the image is clicked (e.g. external page, PDF). Leave empty for no link."
                            >
                              <Input
                                placeholder="e.g., https://example.com or /page"
                                size="large"
                                maxLength={500}
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
                      onClick={() => add({ src: '', alt: '', name: '', link: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Image
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Display Settings */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Display Settings</h3>
          <Form.Item
            name={['content', 'imageOrientation']}
            label="Display Orientation"
            tooltip="Horizontal = 3 columns (2 rows). Vertical = 2 columns (more rows)."
            initialValue="horizontal"
          >
            <Select size="large" placeholder="Select orientation">
              <Option value="horizontal">Horizontal (2 rows × 3 columns)</Option>
              <Option value="vertical">Vertical (3 rows × 2 columns)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name={['content', 'columns']}
            label="Number of Columns"
            tooltip="How many columns to display images in (2, 3, or 6 columns)"
            initialValue={3}
            getValueFromEvent={(value) => {
              return typeof value === 'number' ? value : parseInt(value);
            }}
            normalize={(value) => {
              return typeof value === 'number' ? value : parseInt(value) || 3;
            }}
          >
            <Select size="large" placeholder="Select number of columns">
              <Option value={2}>2 Columns</Option>
              <Option value={3}>3 Columns</Option>
              <Option value={6}>6 Columns</Option>
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default ImageGalleryEditor;

