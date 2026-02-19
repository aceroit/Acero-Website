import { Card, Button, Input, Select, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';
import SimpleRichTextEditor from '../../common/SimpleRichTextEditor';
import './ImageModalGalleryEditor.css';

const { Option } = Select;

/**
 * Image Modal Gallery Editor Component
 * Custom editor for image modal gallery sections with items that open in modal
 */
const ImageModalGalleryEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="image-modal-gallery-editor">
      <div className="space-y-6">
        {/* Title (Optional) */}
        <Form.Item
          name={['content', 'title']}
          label="Gallery Title"
          tooltip="Optional title for the gallery section"
        >
          <Input
            placeholder="e.g., PEB Types"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Gallery Items */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gallery Items <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add items to display in the modal gallery. Each item will have an image, title, and description that opens in a modal when clicked.
          </p>
          <Form.List name={['content', 'items']} initialValue={value.items || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="gallery-items-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No items added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: '', title: '', description: '', image: '', imageAlt: '' })}
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
                            {/* ID */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'id']}
                              label="Item ID"
                              tooltip="Unique identifier for this item (e.g., 'clear-span')"
                              rules={[{ required: true, message: 'Item ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., clear-span"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Title */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'title']}
                              label="Item Title"
                              tooltip="Title displayed for this gallery item"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., CLEAR SPAN"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Description */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              label="Description"
                              tooltip="Description text displayed for this item. Supports bold text and links."
                              rules={[{ required: true, message: 'Description is required' }]}
                            >
                              <SimpleRichTextEditor
                                placeholder="Enter description..."
                              />
                            </Form.Item>

                            {/* Image */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'image']}
                              label="Image"
                              tooltip="Image to display for this gallery item"
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
                                folder="products"
                                label=""
                                maxSize={10}
                              />
                            </Form.Item>

                            {/* Image Alt Text */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'imageAlt']}
                              label="Image Alt Text"
                              tooltip="Alternative text for the image (for accessibility)"
                              rules={[{ required: true, message: 'Image alt text is required' }]}
                            >
                              <Input
                                placeholder="e.g., Clear Span PEB"
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
                      onClick={() => add({ id: '', title: '', description: '', image: '', imageAlt: '' })}
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

        {/* Display Settings */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Display Settings</h3>
          <Form.Item
            name={['content', 'columns']}
            label="Number of Columns"
            tooltip="How many columns to display items in (2 or 3 columns)"
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
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default ImageModalGalleryEditor;

