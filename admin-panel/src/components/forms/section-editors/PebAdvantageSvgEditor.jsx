import { Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Editor for PEB advantages section.
 * The frontend now renders icon cards with pop-up details automatically.
 * No configuration is required in the admin for this section.
 */
const PebAdvantageSvgEditor = () => {
  return (
    <div className="peb-advantage-svg-editor">
      <Card className="border border-gray-200 shadow-sm bg-white mb-6">
        <div className="flex items-start gap-3">
          <InfoCircleOutlined className="text-blue-500 text-xl mt-0.5" />
          <div>
            <p className="font-medium text-gray-800 mb-1">Advantages of PEB section</p>
            <p className="text-sm text-gray-600">
              This section now displays the Advantages of PEB content as icon cards with a detailed pop-up on the frontend.
              The icons, titles, and descriptions are handled automatically, so no extra configuration is required here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PebAdvantageSvgEditor;
