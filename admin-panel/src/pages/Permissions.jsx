import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Spin } from 'antd';
import { SafetyOutlined, InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import * as permissionService from '../services/permissionService';
import * as roleService from '../services/roleService';
import { formatRole, getRoleColor } from '../utils/roleHelpers';
import { toast } from 'react-toastify';

const Permissions = () => {
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch roles from API
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await roleService.getAllRoles({ includeInactive: false });
      if (response.success) {
        const rolesData = response.data.roles || response.data || [];
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoadingRoles(false);
    }
  };

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
    fetchRoles();
    fetchMatrix();
  }, []);

  // Calculate permission stats for a role
  const getRoleStats = (role) => {
    if (!matrix || !matrix.matrix) {
      return { resourceCount: 0, permissionCount: 0 };
    }

    // Try to find role in matrix by slug or _id
    const roleKey = role.slug || role._id || role.name;
    const roleMatrix = matrix.matrix[roleKey] || matrix.matrix[role._id] || matrix.matrix[role.slug];
    
    if (!roleMatrix) {
      return { resourceCount: 0, permissionCount: 0 };
    }

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

  // Handle role card click - navigate to role permissions
  const handleRoleClick = (role) => {
    // Use role._id or role.slug for navigation
    const roleIdentifier = role._id || role.slug || role.name;
    navigate(`/permissions/role/${roleIdentifier}`);
  };

  // Get role display color
  const getRoleDisplayColor = (role) => {
    if (role.color && role.color !== 'default') {
      return role.color;
    }
    // Fallback to helper function
    return getRoleColor(role.slug || role.name);
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    return role.name || formatRole(role.slug || role.name);
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
            {loadingRoles || loading ? (
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No roles found. Please create roles first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const stats = getRoleStats(role);
                  const roleColor = getRoleDisplayColor(role);
                  const roleName = getRoleDisplayName(role);
                  
                  // Color mapping for display
                  const colorMap = {
                    red: '#ef4444',
                    blue: '#3b82f6',
                    purple: '#a855f7',
                    orange: '#f97316',
                    green: '#22c55e',
                    cyan: '#06b6d4',
                    magenta: '#ec4899',
                    gold: '#f59e0b',
                    lime: '#84cc16',
                    default: '#6b7280'
                  };
                  
                  return (
                    <Card
                      key={role._id || role.slug}
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
                              backgroundColor: colorMap[roleColor] || colorMap.default
                            }}
                          >
                            {roleName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-0">
                              {roleName}
                            </h3>
                            <Tag color={roleColor} className="mt-1">
                              {role.slug || role.name}
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
