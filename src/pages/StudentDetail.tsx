import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Row,
  Col,
  Descriptions,
  Table,
  Divider,
  Space,
  message,
  Statistic,
  Tag,
  Timeline,
  Empty,
  Spin,
  Progress,
} from 'antd';
import {
  TrophyOutlined,
  RollbackOutlined,
  HistoryOutlined,
  GiftOutlined,
  TeamOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { studentAPI } from '../services/api';
import './StudentDetail.css';

const { Title, Text } = Typography;

interface StudentData {
  _id: string;
  studentId: number;
  name: string;
  points: {
    discipline: number;
    hygiene: number;
    academic: number;
    other: number;
  };
  exchangeCoins: number;
  group?: string;
  class: {
    _id: string;
    name: string;
  };
}

interface PointLogData {
  _id: string;
  category: 'discipline' | 'hygiene' | 'academic' | 'other';
  points: number;
  reason: string;
  actionType: 'add' | 'subtract';
  createdAt: string;
}

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [pointLogs, setPointLogs] = useState<PointLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudentData();
      fetchPointLogs();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getStudentById(id!);
      setStudent(response.data);
    } catch (error) {
      message.error('获取学生信息失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointLogs = async () => {
    try {
      setLogsLoading(true);
      // 使用API服务获取积分记录
      const response = await studentAPI.getStudentPointLogs(id!);
      setPointLogs(response.data);
      setLogsLoading(false);
    } catch (error) {
      message.error('获取积分记录失败');
      console.error(error);
      setLogsLoading(false);
      
      // 如果API尚未实现，使用模拟数据
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const mockLogs: PointLogData[] = [
            {
              _id: '1',
              category: 'discipline',
              points: 5,
              reason: '课堂表现优秀',
              actionType: 'add',
              createdAt: '2023-06-05T10:30:00Z',
            },
            {
              _id: '2',
              category: 'hygiene',
              points: 3,
              reason: '打扫卫生认真负责',
              actionType: 'add',
              createdAt: '2023-06-03T09:15:00Z',
            },
            {
              _id: '3',
              category: 'academic',
              points: 10,
              reason: '数学考试满分',
              actionType: 'add',
              createdAt: '2023-06-01T14:20:00Z',
            },
            {
              _id: '4',
              category: 'discipline',
              points: 2,
              reason: '上课说话',
              actionType: 'subtract',
              createdAt: '2023-05-29T11:10:00Z',
            },
          ];
          setPointLogs(mockLogs);
          setLogsLoading(false);
        }, 1000);
      }
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discipline':
        return '#1890ff';
      case 'hygiene':
        return '#52c41a';
      case 'academic':
        return '#722ed1';
      case 'other':
        return '#fa8c16';
      default:
        return '#d9d9d9';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'discipline':
        return '纪律';
      case 'hygiene':
        return '卫生';
      case 'academic':
        return '学习';
      case 'other':
        return '其他';
      default:
        return category;
    }
  };

  const getTotalPoints = () => {
    if (!student) return 0;
    return (
      student.points.discipline +
      student.points.hygiene +
      student.points.academic +
      student.points.other
    );
  };

  const getPointsPercentage = (category: keyof StudentData['points']) => {
    const total = getTotalPoints();
    if (total === 0) return 0;
    return Math.round((student?.points[category] || 0) / total * 100);
  };

  const pointLogsColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => (
        <Tag color={getCategoryColor(text)}>{getCategoryName(text)}</Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (text: string, record: PointLogData) => (
        <span style={{ color: text === 'add' ? '#52c41a' : '#f5222d' }}>
          {text === 'add' ? '+' : '-'}{record.points}
        </span>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div className="loading-text">加载学生信息中...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <Empty description="未找到学生信息" />
        <Button type="primary" onClick={handleGoBack} style={{ marginTop: 16 }}>
          返回上一页
        </Button>
      </div>
    );
  }

  return (
    <div className="student-detail-container">
      <div className="page-header">
        <div>
          <Title level={2} className="student-name">
            {student.name}
          </Title>
          <Text className="student-class">
            {student.class.name} · 学号: {student.studentId}
            {student.group && (
              <Tag color="blue" className="student-group">
                {student.group}组
              </Tag>
            )}
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<RollbackOutlined />} 
          onClick={handleGoBack}
        >
          返回班级
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="student-info-card">
            <Statistic
              title="总积分"
              value={getTotalPoints()}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#ff8c00' }}
              className="total-points-statistic"
            />
            <Divider />
            <div className="points-breakdown">
              <div className="points-item">
                <div className="points-label">
                  <div className="category-dot" style={{ backgroundColor: '#1890ff' }}></div>
                  <span>纪律分</span>
                </div>
                <div className="points-value">{student.points.discipline}</div>
                <Progress 
                  percent={getPointsPercentage('discipline')} 
                  showInfo={false} 
                  strokeColor="#1890ff" 
                  size="small"
                />
              </div>
              <div className="points-item">
                <div className="points-label">
                  <div className="category-dot" style={{ backgroundColor: '#52c41a' }}></div>
                  <span>卫生分</span>
                </div>
                <div className="points-value">{student.points.hygiene}</div>
                <Progress 
                  percent={getPointsPercentage('hygiene')} 
                  showInfo={false} 
                  strokeColor="#52c41a" 
                  size="small"
                />
              </div>
              <div className="points-item">
                <div className="points-label">
                  <div className="category-dot" style={{ backgroundColor: '#722ed1' }}></div>
                  <span>学习分</span>
                </div>
                <div className="points-value">{student.points.academic}</div>
                <Progress 
                  percent={getPointsPercentage('academic')} 
                  showInfo={false} 
                  strokeColor="#722ed1" 
                  size="small"
                />
              </div>
              <div className="points-item">
                <div className="points-label">
                  <div className="category-dot" style={{ backgroundColor: '#fa8c16' }}></div>
                  <span>其他分</span>
                </div>
                <div className="points-value">{student.points.other}</div>
                <Progress 
                  percent={getPointsPercentage('other')} 
                  showInfo={false} 
                  strokeColor="#fa8c16" 
                  size="small"
                />
              </div>
            </div>
            <Divider />
            <Statistic
              title="可用兑换币"
              value={student.exchangeCoins}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card 
            title="积分变动记录" 
            className="point-logs-card"
            extra={<Button icon={<HistoryOutlined />} type="link">查看全部</Button>}
          >
            {logsLoading ? (
              <div className="loading-container">
                <Spin />
                <div className="loading-text">加载记录中...</div>
              </div>
            ) : pointLogs.length === 0 ? (
              <Empty description="暂无积分记录" />
            ) : (
              <Table
                columns={pointLogsColumns}
                dataSource={pointLogs}
                rowKey="_id"
                pagination={false}
                className="logs-table"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDetail; 