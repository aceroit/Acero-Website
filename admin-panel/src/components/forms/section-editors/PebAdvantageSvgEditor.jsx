import { Card, Form, Input } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Editor for PEB Advantage SVG section.
 * This section shows the "Advantages of PEB" title and desktop/mobile SVGs on the frontend.
 * No required fields; optional svgUrl overrides the default graphic.
 */
const PebAdvantageSvgEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="peb-advantage-svg-editor">
      <Card className="border border-gray-200 shadow-sm bg-white mb-6">
        <div className="flex items-start gap-3">
          <InfoCircleOutlined className="text-blue-500 text-xl mt-0.5" />
          <div>
            <p className="font-medium text-gray-800 mb-1">Advantages of PEB section</p>
            <p className="text-sm text-gray-600">
              This section displays the &quot;Advantages of PEB&quot; title and the PEB advantages graphic
              (desktop and mobile SVGs) on the frontend. No configuration is required—the default graphic
              is used automatically. Optionally override the SVG URL below if you use a custom graphic.
            </p>
          </div>
        </div>
      </Card>

      <Form.Item
        name={['content', 'svgUrl']}
        label="SVG URL (optional)"
        tooltip="Leave blank to use the default Advantages of PEB graphic. Set a URL to use a custom SVG."
      >
        <Input
          placeholder="e.g. /svgs/peb-advantage.svg"
          size="large"
          allowClear
        />
      </Form.Item>
    </div>
  );
};

export default PebAdvantageSvgEditor;
