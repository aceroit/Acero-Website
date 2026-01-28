import { Card, Input, Form, Switch } from 'antd';
import ImageUpload from '../../common/ImageUpload';
import './HeroImageEditor.css';

/**
 * Hero Image Editor Component
 * Custom editor for hero image sections with image, title, and overlay toggle
 */
const HeroImageEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="hero-image-editor">
      <div className="space-y-6">
        {/* Background Image */}
        <Form.Item
          name={['content', 'image']}
          label="Background Image"
          tooltip="Hero background image (Recommended: 1920x1080px)"
          rules={[{ required: true, message: 'Background image is required' }]}
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
            folder="hero"
            label=""
            maxSize={10}
          />
        </Form.Item>

        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Title"
          tooltip="Title displayed on the hero section"
          rules={[
            { required: true, message: 'Title is required' },
            { max: 100, message: 'Title must not exceed 100 characters' }
          ]}
        >
          <Input
            placeholder="e.g., Acero Building Systems"
            size="large"
            maxLength={100}
          />
        </Form.Item>

        {/* Overlay Toggle */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Display Settings</h3>
          <Form.Item
            name={['content', 'overlay']}
            label="Show Dark Overlay"
            tooltip="Add dark overlay for better text readability"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch size="default" />
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default HeroImageEditor;

