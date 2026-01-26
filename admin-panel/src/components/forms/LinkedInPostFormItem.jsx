import { Form, Input, Button, Card, Switch, InputNumber, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * LinkedIn Post Form Item Component
 * Manages an array of LinkedIn posts within a Company Update form
 * 
 * @param {Object} props
 * @param {Array} props.value - Current LinkedIn posts array
 * @param {Function} props.onChange - Callback when posts change
 */
const LinkedInPostFormItem = ({ value = [], onChange }) => {

  const handleAdd = () => {
    const newPost = {
      companyName: 'Acero Building Systems',
      date: '',
      text: '',
      imageUrl: '',
      videoUrl: '',
      videoThumbnail: '',
      hashtags: [],
      likes: 0,
      comments: 0,
      isVideo: false,
      publishedAt: null,
      order: value.length,
    };
    onChange?.([...value, newPost]);
  };

  const handleRemove = (index) => {
    const updatedPosts = value.filter((_, i) => i !== index);
    // Reorder remaining posts
    updatedPosts.forEach((post, i) => {
      post.order = i;
    });
    onChange?.(updatedPosts);
  };

  const handleChange = (index, field, fieldValue) => {
    const updatedPosts = [...value];
    updatedPosts[index] = {
      ...updatedPosts[index],
      [field]: fieldValue,
    };
    onChange?.(updatedPosts);
  };

  const handleHashtagsChange = (index, hashtagsString) => {
    const hashtags = hashtagsString
      ? hashtagsString.split(',').map(t => t.trim()).filter(t => t)
      : [];
    handleChange(index, 'hashtags', hashtags);
  };

  const handleMove = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedPosts = [...value];
    [updatedPosts[index], updatedPosts[newIndex]] = [updatedPosts[newIndex], updatedPosts[index]];
    
    // Update order fields
    updatedPosts.forEach((post, i) => {
      post.order = i;
    });
    
    onChange?.(updatedPosts);
  };

  return (
    <div className="linkedin-posts-form-item">
      <div className="mb-4">
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          block
          size="large"
        >
          Add LinkedIn Post
        </Button>
      </div>

      {value.length > 0 && (
        <div className="space-y-4">
          {value.map((post, index) => (
            <LinkedInPostCard
              key={index}
              post={post}
              index={index}
              onChange={handleChange}
              onRemove={handleRemove}
              onMove={handleMove}
              onHashtagsChange={handleHashtagsChange}
              canMoveUp={index > 0}
              canMoveDown={index < value.length - 1}
            />
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 rounded-lg">
          <p>No LinkedIn posts added yet. Click "Add LinkedIn Post" to get started.</p>
        </div>
      )}
    </div>
  );
};

/**
 * LinkedIn Post Card Component
 */
const LinkedInPostCard = ({
  post,
  index,
  onChange,
  onRemove,
  onMove,
  onHashtagsChange,
  canMoveUp,
  canMoveDown,
}) => {
  return (
    <Card
      size="small"
      title={
        <div className="flex items-center justify-between">
          <span>LinkedIn Post #{index + 1}</span>
          <Space>
            <Button
              type="text"
              icon={<UpOutlined />}
              onClick={() => onMove(index, 'up')}
              disabled={!canMoveUp}
              size="small"
              title="Move up"
            />
            <Button
              type="text"
              icon={<DownOutlined />}
              onClick={() => onMove(index, 'down')}
              disabled={!canMoveDown}
              size="small"
              title="Move down"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemove(index)}
              size="small"
              title="Remove post"
            />
          </Space>
        </div>
      }
      className="mb-4"
    >
        <div className="space-y-4">
          <Form.Item
            label="Company Name"
            required
            tooltip="Company name displayed on the post"
          >
            <Input
              value={post.companyName || ''}
              onChange={(e) => onChange(index, 'companyName', e.target.value)}
              placeholder="Acero Building Systems"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Date"
            tooltip="Display date (e.g., 'January 2026')"
          >
            <Input
              value={post.date || ''}
              onChange={(e) => onChange(index, 'date', e.target.value)}
              placeholder="January 2026"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Post Text"
            required
            tooltip="Main content of the LinkedIn post"
          >
            <TextArea
              value={post.text || ''}
              onChange={(e) => onChange(index, 'text', e.target.value)}
              placeholder="Enter post text..."
              rows={4}
              size="large"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Image URL"
              tooltip="URL for post image (optional)"
            >
              <Input
                value={post.imageUrl || ''}
                onChange={(e) => onChange(index, 'imageUrl', e.target.value)}
                placeholder="https://..."
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Video URL"
              tooltip="URL for post video (optional)"
            >
              <Input
                value={post.videoUrl || ''}
                onChange={(e) => onChange(index, 'videoUrl', e.target.value)}
                placeholder="https://..."
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Video Thumbnail URL"
            tooltip="Thumbnail image for video posts (optional)"
          >
            <Input
              value={post.videoThumbnail || ''}
              onChange={(e) => onChange(index, 'videoThumbnail', e.target.value)}
              placeholder="https://..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Hashtags"
            tooltip="Comma-separated hashtags (e.g., #Acero, #Steel, #PEB)"
          >
            <Input
              value={Array.isArray(post.hashtags) ? post.hashtags.join(', ') : (post.hashtags || '')}
              onChange={(e) => onHashtagsChange(index, e.target.value)}
              placeholder="#Acero, #Steel, #PEB"
              size="large"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label="Likes"
              tooltip="Number of likes"
            >
              <InputNumber
                value={post.likes || 0}
                onChange={(val) => onChange(index, 'likes', val || 0)}
                min={0}
                size="large"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="Comments"
              tooltip="Number of comments"
            >
              <InputNumber
                value={post.comments || 0}
                onChange={(val) => onChange(index, 'comments', val || 0)}
                min={0}
                size="large"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="Is Video"
              tooltip="Whether this post contains a video"
            >
              <Switch
                checked={post.isVideo || false}
                onChange={(checked) => onChange(index, 'isVideo', checked)}
              />
            </Form.Item>
          </div>
        </div>
      </Card>
  );
};

export default LinkedInPostFormItem;

