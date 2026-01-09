import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Spin } from 'antd';
import { SafetyOutlined, InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import * as permissionService from '../services/permissionService';
import { formatRole, getRoleColor } from '../utils/roleHelpers';
import { ROLES } from '../utils/constants';
import { toast } from 'react-toastify';

const Permissions = () => {
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch permissions matrix
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getPermissionMatrix();
      if (response.success) {
        setMatrix(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  // Calculate permission stats for a role
  const getRoleStats = (role) => {
    if (!matrix || !matrix.matrix || !matrix.matrix[role]) {
      return { resourceCount: 0, permissionCount: 0 };
    }

    const roleMatrix = matrix.matrix[role];
    const resources = Object.keys(roleMatrix);
    let permissionCount = 0;

    resources.forEach((resource) => {
      const perm = roleMatrix[resource];
      if (perm && perm.actions && Array.isArray(perm.actions)) {
        permissionCount += perm.actions.length;
      }
    });

    return {
      resourceCount: resources.length,
      permissionCount,
    };
  };

  // Get all available roles
  const getAllRoles = () => {
    return Object.values(ROLES);
  };

  // Handle role card click
  const handleRoleClick = (role) => {
    navigate(`/permissions/role/${role}`);
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Permission Management
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Configure role-based access control and permissions
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mb-6 md:mb-8">
          <Card className="border border-gray-200 shadow-md bg-white">
            <div className="flex items-start gap-3">
              <InfoCircleOutlined className="text-gray-600 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">About Permissions</h3>
                <p className="text-sm text-gray-600">
                  Click on any role card below to view and edit its permissions. Each role can have different access levels for various resources and actions.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Roles List */}
        <div className="mb-6 md:mb-8">
          <Card 
            className="border border-gray-200 shadow-md bg-white"
            title={
              <div className="flex items-center gap-2">
                <SafetyOutlined className="text-gray-800" />
                <span className="text-lg font-semibold text-gray-900">Roles</span>
              </div>
            }
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAllRoles().map((role) => {
                  const stats = getRoleStats(role);
                  const roleColor = getRoleColor(role);
                  
                  return (
                    <Card
                      key={role}
                      hoverable
                      onClick={() => handleRoleClick(role)}
                      className="cursor-pointer border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-400"
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{
                              backgroundColor: roleColor === 'red' ? '#ef4444' :
                                              roleColor === 'blue' ? '#3b82f6' :
                                              roleColor === 'purple' ? '#a855f7' :
                                              roleColor === 'orange' ? '#f97316' :
                                              roleColor === 'green' ? '#22c55e' :
                                              '#6b7280'
                            }}
                          >
                            {formatRole(role).charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-0">
                              {formatRole(role)}
                            </h3>
                            <Tag color={roleColor} className="mt-1">
                              {role}
                            </Tag>
                          </div>
                        </div>
                        <ArrowRightOutlined className="text-gray-400 text-xl" />
                      </div>
                      
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Resources</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {stats.resourceCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Permissions</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {stats.permissionCount}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Permissions;
