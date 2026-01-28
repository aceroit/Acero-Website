import { Card, Statistic, Row, Col, Tag, Divider, Empty, List, Progress, Alert, Tooltip, Button, Spin, Typography } from "antd";
import { 
    UserOutlined, 
    FileTextOutlined, 
    SettingOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    SafetyOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined,
    FileOutlined,
    EditOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    RocketOutlined,
    EyeOutlined,
    HistoryOutlined,
    ExclamationCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionContext";
import { formatRole, getUserFullName } from "../utils/roleHelpers";
import { useEffect, useState } from "react";
import * as userService from "../services/userService";
import * as dashboardService from "../services/dashboardService";
import WorkflowStatusBadge from "../components/workflow/WorkflowStatusBadge";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

const Dashboard = () => {
    const { user } = useAuth();
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const [userStats, setUserStats] = useState(null);
    const [workload, setWorkload] = useState(null);
    const [drafts, setDrafts] = useState(null);
    const [submissions, setSubmissions] = useState(null);
    const [workflowMetrics, setWorkflowMetrics] = useState(null);
    const [pendingItems, setPendingItems] = useState(null);
    const [teamActivity, setTeamActivity] = useState(null);
    const [bottlenecks, setBottlenecks] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [hasPermission]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch user stats if user has users:read permission
            if (hasPermission('users', 'read')) {
                try {
                    const userStatsResponse = await userService.getUserStats();
                    if (userStatsResponse.success) {
                        setUserStats(userStatsResponse.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch user stats:', error);
                }
            }

            // Fetch workload summary (available to all authenticated users)
            try {
                const workloadResponse = await dashboardService.getUserWorkloadSummary();
                if (workloadResponse.success) {
                    setWorkload(workloadResponse.data?.workload);
                }
            } catch (error) {
                console.error('Failed to fetch workload:', error);
            }

            // Fetch drafts if user has pages:read or sections:read
            if (hasPermission('pages', 'read') || hasPermission('sections', 'read')) {
                try {
                    const draftsResponse = await dashboardService.getMyDrafts();
                    if (draftsResponse.success) {
                        setDrafts(draftsResponse.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch drafts:', error);
                }
            }

            // Fetch submissions if user has pages:read or sections:read
            if (hasPermission('pages', 'read') || hasPermission('sections', 'read')) {
                try {
                    const submissionsResponse = await dashboardService.getMySubmissions();
                    if (submissionsResponse.success) {
                        setSubmissions(submissionsResponse.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch submissions:', error);
                }
            }

            // Fetch workflow metrics
            try {
                const metricsResponse = await dashboardService.getWorkflowMetrics();
                if (metricsResponse.success) {
                    setWorkflowMetrics(metricsResponse.data);
                }
            } catch (error) {
                console.error('Failed to fetch workflow metrics:', error);
            }

            // Fetch pending items
            try {
                const pendingResponse = await dashboardService.getPendingItems();
                if (pendingResponse.success) {
                    setPendingItems(pendingResponse.data);
                }
            } catch (error) {
                console.error('Failed to fetch pending items:', error);
            }

            // Fetch team activity
            try {
                const activityResponse = await dashboardService.getTeamActivity(10);
                if (activityResponse.success) {
                    setTeamActivity(activityResponse.data);
                }
            } catch (error) {
                console.error('Failed to fetch team activity:', error);
            }

            // Fetch bottlenecks (admin only)
            if (hasPermission('pages', 'delete')) {
                try {
                    const bottlenecksResponse = await dashboardService.getBottlenecks();
                    if (bottlenecksResponse.success) {
                        setBottlenecks(bottlenecksResponse.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch bottlenecks:', error);
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // User stats cards (only shown if user has users:read permission)
    const userStatCards = userStats ? [
        {
            title: "Total Users",
            value: userStats.total || 0,
            icon: <TeamOutlined />,
            color: "#1890ff"
        },
        {
            title: "Active Users",
            value: userStats.active || 0,
            icon: <CheckCircleOutlined />,
            color: "#52c41a"
        },
        {
            title: "Inactive Users",
            value: userStats.inactive || 0,
            icon: <UserOutlined />,
            color: "#ff4d4f"
        }
    ] : [];

    // Workload cards (shown for all users)
    const workloadCards = workload ? [
        {
            title: "My Drafts",
            value: workload.myDrafts || 0,
            icon: <EditOutlined />,
            color: "#722ed1"
        },
        {
            title: "My Submissions",
            value: workload.mySubmissions || 0,
            icon: <FileOutlined />,
            color: "#13c2c2"
        },
        ...(workload.pendingMyReview !== undefined ? [{
            title: "Pending Review",
            value: workload.pendingMyReview || 0,
            icon: <ClockCircleOutlined />,
            color: "#fa8c16"
        }] : []),
        ...(workload.pendingMyApproval !== undefined ? [{
            title: "Pending Approval",
            value: workload.pendingMyApproval || 0,
            icon: <CheckCircleOutlined />,
            color: "#1890ff"
        }] : []),
        ...(workload.pendingPublish !== undefined ? [{
            title: "Pending Publish",
            value: workload.pendingPublish || 0,
            icon: <FileTextOutlined />,
            color: "#52c41a"
        }] : [])
    ] : [];

    return (
        <MainLayout>
            <div className="space-y-6 md:space-y-8 p-4 md:p-0">
                {/* Welcome Section */}
                <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white">
                                Welcome back - {getUserFullName(user)}! 👋
                            </h1>
                            <p className="text-gray-200 text-sm md:text-base">
                            You are logged in as - <Tag color="default" className="ml-2 bg-white text-gray-800 border-0">{formatRole(user?.role)}</Tag>
                            </p>
                        </div>
                        <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full backdrop-blur-sm">
                            <UserOutlined className="text-2xl md:text-3xl text-white" />
                        </div>
                    </div>
                </div>

                {/* User Stats Cards - Only shown if user has users:read permission */}
                {userStatCards.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">User Statistics</h2>
                        <Row gutter={[16, 16]}>
                            {userStatCards.map((stat, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <Card 
                                        className="h-full hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-md bg-white"
                                        bodyStyle={{ padding: '24px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-gray-600 text-sm font-medium mb-2">{stat.title}</p>
                                                <Statistic
                                                    value={stat.value}
                                                    valueStyle={{ 
                                                        fontSize: '28px', 
                                                        fontWeight: 'bold',
                                                        color: '#111827'
                                                    }}
                                                    loading={loading}
                                                />
                                            </div>
                                            <div className="p-4 rounded-xl" style={{ backgroundColor: stat.color + '20' }}>
                                                <div style={{ color: stat.color, fontSize: '24px' }}>
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* Workload Cards - Shown for all authenticated users */}
                {workloadCards.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Workload</h2>
                        <Row gutter={[16, 16]}>
                            {workloadCards.map((stat, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <Card 
                                        className="h-full hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-md bg-white"
                                        bodyStyle={{ padding: '24px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-gray-600 text-sm font-medium mb-2">{stat.title}</p>
                                                <Statistic
                                                    value={stat.value}
                                                    valueStyle={{ 
                                                        fontSize: '28px', 
                                                        fontWeight: 'bold',
                                                        color: '#111827'
                                                    }}
                                                    loading={loading}
                                                />
                                            </div>
                                            <div className="p-4 rounded-xl" style={{ backgroundColor: stat.color + '20' }}>
                                                <div style={{ color: stat.color, fontSize: '24px' }}>
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* Workflow Metrics Widget */}
                {workflowMetrics && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Workflow Metrics</h2>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <Card 
                                    className="h-full border border-gray-200 shadow-md bg-white"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <FileTextOutlined />
                                            <span>Pages</span>
                                        </div>
                                    }
                                >
                                    <Row gutter={[8, 8]}>
                                        {Object.entries(workflowMetrics.pages || {}).map(([status, count]) => (
                                            <Col span={12} key={status}>
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <WorkflowStatusBadge status={status} />
                                                    <span className="font-semibold text-lg">{count}</span>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div className="text-center">
                                        <Text type="secondary">Total: </Text>
                                        <Text strong>{workflowMetrics.totals?.pages || 0}</Text>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card 
                                    className="h-full border border-gray-200 shadow-md bg-white"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <FileOutlined />
                                            <span>Sections</span>
                                        </div>
                                    }
                                >
                                    <Row gutter={[8, 8]}>
                                        {Object.entries(workflowMetrics.sections || {}).map(([status, count]) => (
                                            <Col span={12} key={status}>
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <WorkflowStatusBadge status={status} />
                                                    <span className="font-semibold text-lg">{count}</span>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div className="text-center">
                                        <Text type="secondary">Total: </Text>
                                        <Text strong>{workflowMetrics.totals?.sections || 0}</Text>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* Pending Items Widget */}
                {pendingItems && (pendingItems.count?.pages > 0 || pendingItems.count?.sections > 0) && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Items Awaiting Your Action</h2>
                        <Card className="border border-orange-200 shadow-md bg-white">
                            <Alert
                                message={`You have ${(pendingItems.count?.pages || 0) + (pendingItems.count?.sections || 0)} item(s) pending your action`}
                                type="warning"
                                icon={<ExclamationCircleOutlined />}
                                style={{ marginBottom: '16px' }}
                            />
                            <Row gutter={[16, 16]}>
                                {pendingItems.pending?.pages && pendingItems.pending.pages.length > 0 && (
                                    <Col xs={24} lg={12}>
                                        <div>
                                            <Text strong className="text-orange-600">Pages ({pendingItems.pending.pages.length})</Text>
                                            <List
                                                size="small"
                                                dataSource={pendingItems.pending.pages.slice(0, 5)}
                                                renderItem={(page) => (
                                                    <List.Item
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => navigate(`/pages/${page._id}`)}
                                                    >
                                                        <List.Item.Meta
                                                            title={
                                                                <div className="flex items-center gap-2">
                                                                    <span>{page.title}</span>
                                                                    <WorkflowStatusBadge status={page.status} />
                                                                </div>
                                                            }
                                                            description={
                                                                <div className="text-xs text-gray-500">
                                                                    Updated {dayjs(page.updatedAt).fromNow()}
                                                                </div>
                                                            }
                                                        />
                                                        <Button type="link" size="small" icon={<EyeOutlined />}>
                                                            View
                                                        </Button>
                                                    </List.Item>
                                                )}
                                            />
                                            {pendingItems.pending.pages.length > 5 && (
                                                <div className="text-center mt-2">
                                                    <Button type="link" onClick={() => navigate('/dashboard/pending')}>
                                                        View all {pendingItems.pending.pages.length} pages
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                )}
                                {pendingItems.pending?.sections && pendingItems.pending.sections.length > 0 && (
                                    <Col xs={24} lg={12}>
                                        <div>
                                            <Text strong className="text-orange-600">Sections ({pendingItems.pending.sections.length})</Text>
                                            <List
                                                size="small"
                                                dataSource={pendingItems.pending.sections.slice(0, 5)}
                                                renderItem={(section) => (
                                                    <List.Item
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => {
                                                            if (section.pageId?._id) {
                                                                navigate(`/pages/${section.pageId._id}/sections/${section._id}`);
                                                            }
                                                        }}
                                                    >
                                                        <List.Item.Meta
                                                            title={
                                                                <div className="flex items-center gap-2">
                                                                    <span>{section.pageId?.title || 'Section'}</span>
                                                                    <WorkflowStatusBadge status={section.status} />
                                                                </div>
                                                            }
                                                            description={
                                                                <div className="text-xs text-gray-500">
                                                                    Updated {dayjs(section.updatedAt).fromNow()}
                                                                </div>
                                                            }
                                                        />
                                                        <Button type="link" size="small" icon={<EyeOutlined />}>
                                                            View
                                                        </Button>
                                                    </List.Item>
                                                )}
                                            />
                                            {pendingItems.pending.sections.length > 5 && (
                                                <div className="text-center mt-2">
                                                    <Button type="link" onClick={() => navigate('/dashboard/pending')}>
                                                        View all {pendingItems.pending.sections.length} sections
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card>
                    </div>
                )}

                {/* Team Activity Feed */}
                {teamActivity && teamActivity.activities && teamActivity.activities.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Team Activity</h2>
                        <Card className="border border-gray-200 shadow-md bg-white">
                            <List
                                dataSource={teamActivity.activities}
                                renderItem={(activity) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <UserOutlined className="text-blue-600" />
                                                </div>
                                            }
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <Text strong>
                                                        {activity.userId?.firstName && activity.userId?.lastName
                                                            ? `${activity.userId.firstName} ${activity.userId.lastName}`
                                                            : activity.userId?.email || 'System'}
                                                    </Text>
                                                    <Tag>{activity.action}</Tag>
                                                    <Tag color="blue">{activity.resource}</Tag>
                                                </div>
                                            }
                                            description={
                                                <div className="text-xs text-gray-500">
                                                    {dayjs(activity.timestamp).fromNow()}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </div>
                )}

                {/* Workflow Bottlenecks (Admin Only) */}
                {bottlenecks && bottlenecks.count?.total > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Workflow Bottlenecks</h2>
                        <Card className="border border-red-200 shadow-md bg-white">
                            <Alert
                                message={`${bottlenecks.count.total} item(s) stuck in workflow for ${bottlenecks.threshold?.days || 7}+ days`}
                                type="error"
                                icon={<WarningOutlined />}
                                style={{ marginBottom: '16px' }}
                            />
                            <Row gutter={[16, 16]}>
                                {bottlenecks.bottlenecks?.pages && bottlenecks.bottlenecks.pages.length > 0 && (
                                    <Col xs={24} lg={12}>
                                        <div>
                                            <Text strong className="text-red-600">Pages ({bottlenecks.bottlenecks.pages.length})</Text>
                                            <List
                                                size="small"
                                                dataSource={bottlenecks.bottlenecks.pages.slice(0, 5)}
                                                renderItem={(page) => (
                                                    <List.Item
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => navigate(`/pages/${page._id}`)}
                                                    >
                                                        <List.Item.Meta
                                                            title={
                                                                <div className="flex items-center gap-2">
                                                                    <span>{page.title}</span>
                                                                    <WorkflowStatusBadge status={page.status} />
                                                                    <Tag color="red">{page.daysStuck} days</Tag>
                                                                </div>
                                                            }
                                                            description={
                                                                <div className="text-xs text-gray-500">
                                                                    Stuck since {dayjs(page.updatedAt).format('MMM DD, YYYY')}
                                                                </div>
                                                            }
                                                        />
                                                        <Button type="link" size="small" icon={<EyeOutlined />}>
                                                            View
                                                        </Button>
                                                    </List.Item>
                                                )}
                                            />
                                        </div>
                                    </Col>
                                )}
                                {bottlenecks.bottlenecks?.sections && bottlenecks.bottlenecks.sections.length > 0 && (
                                    <Col xs={24} lg={12}>
                                        <div>
                                            <Text strong className="text-red-600">Sections ({bottlenecks.bottlenecks.sections.length})</Text>
                                            <List
                                                size="small"
                                                dataSource={bottlenecks.bottlenecks.sections.slice(0, 5)}
                                                renderItem={(section) => (
                                                    <List.Item
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => {
                                                            if (section.pageId?._id) {
                                                                navigate(`/pages/${section.pageId._id}/sections/${section._id}`);
                                                            }
                                                        }}
                                                    >
                                                        <List.Item.Meta
                                                            title={
                                                                <div className="flex items-center gap-2">
                                                                    <span>{section.pageId?.title || 'Section'}</span>
                                                                    <WorkflowStatusBadge status={section.status} />
                                                                    <Tag color="red">{section.daysStuck} days</Tag>
                                                                </div>
                                                            }
                                                            description={
                                                                <div className="text-xs text-gray-500">
                                                                    Stuck since {dayjs(section.updatedAt).format('MMM DD, YYYY')}
                                                                </div>
                                                            }
                                                        />
                                                        <Button type="link" size="small" icon={<EyeOutlined />}>
                                                            View
                                                        </Button>
                                                    </List.Item>
                                                )}
                                            />
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card>
                    </div>
                )}

                {/* Empty State - Show if user has no permissions or no data */}
                {!loading && userStatCards.length === 0 && workloadCards.length === 0 && !workflowMetrics && !pendingItems && (
                    <Card className="border border-gray-200 shadow-md bg-white">
                        <Empty 
                            description={
                                <span className="text-gray-600">
                                    {hasPermission('users', 'read') || hasPermission('pages', 'read') || hasPermission('sections', 'read')
                                        ? "No data available at the moment"
                                        : "You don't have permissions to view dashboard data"}
                                </span>
                            }
                        />
                    </Card>
                )}

                {/* Quick Actions & System Info */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card 
                            className="h-full shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white"
                            title={
                                <div className="flex items-center gap-2">
                                    <ThunderboltOutlined className="text-gray-800" />
                                    <span className="font-semibold text-lg text-gray-900">Quick Actions</span>
                                </div>
                            }
                        >
                            <div className="space-y-3">
                                {hasPermission('users', 'read') && (
                                    <div 
                                        onClick={() => navigate('/users')}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-gray-200"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <TeamOutlined className="text-blue-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">View and manage users</span>
                                    </div>
                                )}
                                {hasPermission('permissions', 'read') && (
                                    <div 
                                        onClick={() => navigate('/permissions')}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-gray-200"
                                    >
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                            <SafetyOutlined className="text-purple-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">Manage permissions</span>
                                    </div>
                                )}
                                {hasPermission('pages', 'read') && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-gray-200">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                            <FileTextOutlined className="text-green-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">View pages</span>
                                    </div>
                                )}
                                {hasPermission('sections', 'read') && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-gray-200">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                            <FileOutlined className="text-orange-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">View sections</span>
                                    </div>
                                )}
                                {(!hasPermission('users', 'read') && 
                                  !hasPermission('permissions', 'read') && 
                                  !hasPermission('pages', 'read') && 
                                  !hasPermission('sections', 'read')) && (
                                    <div className="text-center py-4 text-gray-500">
                                        No quick actions available
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card 
                            className="h-full shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white"
                            title={
                                <div className="flex items-center gap-2">
                                    <InfoCircleOutlined className="text-gray-800" />
                                    <span className="font-semibold text-lg text-gray-900">System Information</span>
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-gray-700 font-medium">Role</span>
                                    <Tag color="default" className="font-semibold px-3 py-1 bg-gray-800 text-white border-0">
                                        {formatRole(user?.role)}
                                    </Tag>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-gray-700 font-medium">Email</span>
                                    <span className="text-gray-900 font-medium">{user?.email}</span>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
