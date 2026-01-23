import { Card, Button, Input, InputNumber, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './CircularAdvantagesEditor.css';

const { TextArea } = Input;

/**
 * Circular Advantages Editor Component
 * Custom editor for circular advantages sections with position management
 */
const CircularAdvantagesEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="circular-advantages-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Title for the circular advantages section"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Advantages of PEB"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Center Text (Optional) */}
        <Form.Item
          name={['content', 'centerText']}
          label="Center Text"
          tooltip="Text displayed in the center of the circular layout (default: ACERO)"
          initialValue="ACERO"
        >
          <Input
            placeholder="e.g., ACERO"
            size="large"
            maxLength={50}
          />
        </Form.Item>

        {/* Advantages */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Advantages <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add advantages to display in a circular layout. Each advantage needs a position (1-9) that determines its placement around the center. Available icons: Zap, DollarSign, Shield, Leaf, CheckCircle, Layers, Lightbulb, Settings, Grid, etc.
          </p>
          <Form.List name={['content', 'advantages']} initialValue={value.advantages || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="advantages-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No advantages added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: '', title: '', description: '', icon: '', position: 1 })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Advantage
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
                                Advantage {index + 1}
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
                              label="Advantage ID"
                              tooltip="Unique identifier for this advantage"
                              rules={[{ required: true, message: 'Advantage ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., speed"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Title */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'title']}
                              label="Advantage Title"
                              tooltip="Title displayed for this advantage"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., Speed of Construction"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Description */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              label="Description"
                              tooltip="Description text for this advantage"
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

                            {/* Icon */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'icon']}
                              label="Icon Name"
                              tooltip="Icon name from Lucide React (e.g., Zap, DollarSign, Shield, Leaf, CheckCircle, Layers, Lightbulb, Settings, Grid)"
                              rules={[{ required: true, message: 'Icon name is required' }]}
                            >
                              <Input
                                placeholder="e.g., Zap (available: Zap, DollarSign, Shield, Leaf, CheckCircle, Layers, Lightbulb, Settings, Grid)"
                                size="large"
                                maxLength={50}
                              />
                            </Form.Item>

                            {/* Position */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'position']}
                              label="Position"
                              tooltip="Position on the circular layout (1-9). This determines where the advantage appears around the center."
                              rules={[
                                { required: true, message: 'Position is required' },
                                { type: 'number', min: 1, max: 9, message: 'Position must be between 1 and 9' }
                              ]}
                            >
                              <InputNumber
                                placeholder="1-9"
                                size="large"
                                min={1}
                                max={9}
                                style={{ width: '100%' }}
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
                      onClick={() => add({ id: '', title: '', description: '', icon: '', position: 1 })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Advantage
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>
      </div>
    </div>
  );
};

export default CircularAdvantagesEditor;

