import { Card, Button, Input, Select, Space, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import './ProjectsGridEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Projects Grid Editor Component
 * Custom editor for projects grid sections
 */
const ProjectsGridEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="projects-grid-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Our Projects"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Subtitle */}
        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Optional subtitle displayed below the title"
        >
          <TextArea
            placeholder="e.g., Showcasing our expertise through successful steel building projects"
            rows={2}
            size="large"
            maxLength={300}
            showCount
          />
        </Form.Item>

        {/* Projects */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Projects <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add projects to display in the grid. Each project will show an image, title, description, category badge, and link.
          </p>
          <Form.List name={['content', 'projects']} initialValue={value.projects || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="projects-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No projects added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: '', title: '', description: '', image: '', category: '', link: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Project
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
                                Project {index + 1}
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
                            {/* Project Image */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'image']}
                              label="Project Image"
                              tooltip="Main image for the project card"
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
                                folder="projects"
                                label=""
                                maxSize={10}
                              />
                            </Form.Item>

                            {/* Project ID */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'id']}
                              label="Project ID"
                              tooltip="Unique identifier for the project"
                              rules={[{ required: true, message: 'Project ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., 1, project-1"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Project Title */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'title']}
                              label="Project Title"
                              tooltip="Title displayed on the project card"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., Industrial Warehouse Complex"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Project Description */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              label="Project Description"
                              tooltip="Brief description of the project"
                              rules={[{ required: true, message: 'Description is required' }]}
                            >
                              <TextArea
                                placeholder="e.g., A state-of-the-art warehouse facility spanning 50,000 square meters..."
                                rows={3}
                                size="large"
                                maxLength={500}
                                showCount
                              />
                            </Form.Item>

                            {/* Category and Link */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Form.Item
                                {...field}
                                name={[field.name, 'category']}
                                label="Category"
                                tooltip="Category badge displayed on the project card (e.g., PEB, Conventional)"
                              >
                                <Input
                                  placeholder="e.g., PEB, Conventional, Racking Systems"
                                  size="large"
                                  maxLength={50}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'link']}
                                label="Project Link"
                                tooltip="URL or path to the project detail page"
                              >
                                <Input
                                  placeholder="e.g., /projects/industrial-warehouse"
                                  size="large"
                                  maxLength={500}
                                />
                              </Form.Item>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ id: '', title: '', description: '', image: '', category: '', link: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Project
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
            tooltip="How many columns to display projects in (3 or 4 columns)"
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

export default ProjectsGridEditor;

