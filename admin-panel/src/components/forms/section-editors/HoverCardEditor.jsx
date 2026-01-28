import { Card, Button, Input, Select, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';
import './HoverCardEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Hover Card Editor Component
 * Custom editor for hover card sections with cards that reveal description on hover
 */
const HoverCardEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="hover-card-editor">
      <div className="space-y-6">
        {/* Title (Optional) */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Optional title for the hover card section"
        >
          <Input
            placeholder="e.g., Steel Building Accessories"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Subtitle (Optional) */}
        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Optional subtitle text displayed below the title"
        >
          <TextArea
            placeholder="e.g., To learn more about steel building accessories, hover over the accessory image"
            rows={2}
            size="large"
            maxLength={300}
            showCount
          />
        </Form.Item>

        {/* Hover Cards */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hover Cards <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add cards that reveal description on hover. Each card will have an image, title, and description that appears when hovering.
          </p>
          <Form.List name={['content', 'cards']} initialValue={value.cards || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="hover-cards-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No cards added yet</p>
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
                        Add First Card
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
                                Card {index + 1}
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
                              name={[field.name, 'id']}
                              label="Card ID"
                              tooltip="Unique identifier for this card"
                              rules={[{ required: true, message: 'Card ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., sandtrap-louvre"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Title */}
                            <Form.Item
                              name={[field.name, 'title']}
                              label="Card Title"
                              tooltip="Title displayed on the card"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., Sandtrap louvre"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Description */}
                            <Form.Item
                              name={[field.name, 'description']}
                              label="Description"
                              tooltip="Description text that appears when hovering over the card"
                              rules={[{ required: true, message: 'Description is required' }]}
                            >
                              <TextArea
                                placeholder="Enter description..."
                                rows={3}
                                size="large"
                                maxLength={500}
                                showCount
                              />
                            </Form.Item>

                            {/* Image */}
                            <Form.Item
                              name={[field.name, 'image']}
                              label="Card Image"
                              tooltip="Image to display on the card"
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
                              name={[field.name, 'imageAlt']}
                              label="Image Alt Text"
                              tooltip="Alternative text for the image (for accessibility)"
                              rules={[{ required: true, message: 'Image alt text is required' }]}
                            >
                              <Input
                                placeholder="e.g., Sandtrap louvre"
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
                      Add Another Card
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
            tooltip="How many columns to display cards in (3 or 4 columns)"
            initialValue="3"
          >
            <Select size="large" placeholder="Select number of columns">
              <Option value="3">3 Columns</Option>
              <Option value="4">4 Columns</Option>
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default HoverCardEditor;

