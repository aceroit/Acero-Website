import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space, Tag } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import PageTreeView from '../components/pages/PageTreeView';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';

const PageTree = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePageSelect = (page) => {
    if (hasPermission('pages', 'update')) {
      navigate(`/pages/${page._id}`);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Page Tree
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage your website's page hierarchy with drag and drop
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <PermissionWrapper resource="pages" action="create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/pages/new')}
                className="text-white"
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Create Page
              </Button>
            </PermissionWrapper>
          </Space>
        </div>

        {/* Info Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <FileTextOutlined />
              <span>Click a page to edit</span>
            </span>
            {hasPermission('pages', 'update') && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-2">
                  <span>Drag pages to reorder or move to different parent</span>
                </span>
              </>
            )}
          </div>
        </Card>

        {/* Tree View Card */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          styles={{ body: { padding: '24px' } }}
        >
          <PageTreeView
            key={refreshKey}
            onPageSelect={handlePageSelect}
            onRefresh={handleRefresh}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default PageTree;

