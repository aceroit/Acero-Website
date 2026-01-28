import { Card, Input, Form } from 'antd';
import ImageUpload from '../../common/ImageUpload';
import './ImageDisplayEditor.css';

const { TextArea } = Input;

/**
 * Image Display Editor Component
 * Custom editor for single image display sections
 */
const ImageDisplayEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="image-display-editor">
      <div className="space-y-6">
        {/* Image */}
        <Form.Item
          name={['content', 'image']}
          label="Image"
          tooltip="Image to display (Recommended: 1200x675px)"
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
          name={['content', 'imageAlt']}
          label="Image Alt Text"
          tooltip="Alternative text for the image (for accessibility)"
          rules={[{ required: true, message: 'Image alt text is required' }]}
        >
          <Input
            placeholder="e.g., PEB Model"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Title (Optional) */}
        <Form.Item
          name={['content', 'title']}
          label="Title"
          tooltip="Optional title to display above the image"
        >
          <Input
            placeholder="e.g., PEB Model"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Caption (Optional) */}
        <Form.Item
          name={['content', 'caption']}
          label="Caption"
          tooltip="Optional caption text to display below the image"
        >
          <TextArea
            placeholder="Enter caption text..."
            rows={3}
            size="large"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default ImageDisplayEditor;

