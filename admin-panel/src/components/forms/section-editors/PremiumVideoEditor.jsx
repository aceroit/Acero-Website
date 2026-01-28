import { Card, Input, Form, Switch, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './PremiumVideoEditor.css';

const { TextArea } = Input;

/**
 * Premium Video Editor Component
 * Custom editor for premium video sections with YouTube embed
 */
const PremiumVideoEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="premium-video-editor">
      <div className="space-y-6">
        {/* YouTube Video ID */}
        <Form.Item
          name={['content', 'videoId']}
          label="YouTube Video ID"
          tooltip="YouTube video ID from the URL (e.g., from youtube.com/watch?v=VIDEO_ID)"
          rules={[
            { required: true, message: 'YouTube Video ID is required' },
            {
              pattern: /^[a-zA-Z0-9_-]{11}$/,
              message: 'Invalid YouTube Video ID format (should be 11 characters)'
            }
          ]}
        >
          <Input
            placeholder="e.g., dQw4w9WgXcQ"
            size="large"
            maxLength={11}
          />
        </Form.Item>

        {/* Help Text */}
        <Alert
          message="How to find YouTube Video ID"
          description={
            <div className="text-sm">
              <p className="mb-2">From a YouTube URL like: <code className="bg-gray-100 px-1 rounded">https://www.youtube.com/watch?v=dQw4w9WgXcQ</code></p>
              <p>The Video ID is the part after <code className="bg-gray-100 px-1 rounded">v=</code> (in this example: <code className="bg-gray-100 px-1 rounded">dQw4w9WgXcQ</code>)</p>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          className="mb-4"
        />

        {/* Optional Title */}
        <Form.Item
          name={['content', 'title']}
          label="Video Title (Optional)"
          tooltip="Optional title displayed above the video"
        >
          <Input
            placeholder="e.g., Company Introduction Video"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Video Settings */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Video Settings</h3>
          <div className="space-y-4">
            <Form.Item
              name={['content', 'autoplay']}
              label="Autoplay"
              tooltip="Automatically start playing the video when page loads"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch size="default" />
            </Form.Item>

            <Form.Item
              name={['content', 'muted']}
              label="Muted"
              tooltip="Start video with sound muted"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch size="default" />
            </Form.Item>

            <Form.Item
              name={['content', 'loop']}
              label="Loop"
              tooltip="Automatically replay video when it ends"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch size="default" />
            </Form.Item>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PremiumVideoEditor;

