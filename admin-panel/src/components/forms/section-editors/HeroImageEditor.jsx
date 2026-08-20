import { Card, Input, Form, Select, Switch } from 'antd';
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
          tooltip="Optional title displayed on the hero section"
          rules={[
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

          <Form.Item
            name={['content', 'imageFit']}
            label="Image Fit"
            tooltip="Use Cover for photo banners. Use Contain for designed banners or artwork that must not be cropped. Leave blank to use the page default."
          >
            <Select
              size="large"
              allowClear
              placeholder="Use page default"
              options={[
                { label: 'Cover (fill banner, may crop)', value: 'cover' },
                { label: 'Contain (show full image)', value: 'contain' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name={['content', 'imagePosition']}
            label="Image Position"
            tooltip="Controls the focal point when Cover is selected. Leave blank to use center."
          >
            <Select
              size="large"
              allowClear
              placeholder="Use center"
              options={[
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' }
              ]}
            />
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default HeroImageEditor;

