import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Row,
  Col,
  Tabs,
  Space,
  Select,
  DatePicker,
  Statistic,
  Table,
  Spin,
  Empty,
  Radio,
  Divider,
  Progress,
  Tag,
  message,
} from 'antd';
import {
  RollbackOutlined,
  DownloadOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './Statistics.css';
import { studentAPI, classAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ClassInfo {
  id: string;
  name: string;
  description?: string;
}

interface PointsSummary {
  totalPoints: number;
  totalAddedPoints: number;
  totalSubtractedPoints: number;
  categorySummary: {
    discipline: { total: number, added: number, subtracted: number };
    hygiene: { total: number, added: number, subtracted: number };
    academic: { total: number, added: number, subtracted: number };
    other: { total: number, added: number, subtracted: number };
  };
}

interface GroupSummary {
  group: string;
  totalPoints: number;
  averagePoints: number;
  studentCount: number;
  categorySummary: {
    discipline: number;
    hygiene: number;
    academic: number;
    other: number;
  };
}

interface DailyTrend {
  date: string;
  category: string;
  points: number;
  actionType: 'add' | 'subtract';
}

interface TopStudent {
  id: string;
  name: string;
  studentId: number;
  group?: string;
  totalPoints: number;
  disciplinePoints: number;
  hygienePoints: number;
  academicPoints: number;
  otherPoints: number;
}

// 类别数据类型
interface CategoryData {
  category: string;
  total: number;
  added: number;
  subtracted: number;
}

// 类别颜色映射
const categoryColors = {
  discipline: '#1890ff',
  hygiene: '#52c41a',
  academic: '#722ed1',
  other: '#fa8c16'
};

// 定义tab标签
const tabs = [
  {
    key: 'overview',
    tab: '班级概览',
    icon: <DashboardOutlined />
  },
  {
    key: 'groups',
    tab: '小组统计',
    icon: <TeamOutlined />
  },
  {
    key: 'trends',
    tab: '趋势分析',
    icon: <LineChartOutlined />
  }
];

const Statistics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [groupSummary, setGroupSummary] = useState<GroupSummary[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  
  const [activeTabKey, setActiveTabKey] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().setDate(new Date().getDate() - 30)), // 最近30天
    new Date()
  ]);
  const [pointsCategory, setPointsCategory] = useState<'all' | 'discipline' | 'hygiene' | 'academic' | 'other'>('all');
  const [chartType, setChartType] = useState<'column'>('column');

  // 获取班级信息
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        // 实际开发中需要替换为真实API调用
        // const response = await axios.get(`/api/classes/${id}`);
        // setClassInfo(response.data);
        
        // 从API获取班级信息
        if (USE_MOCK_DATA) {
          await mockDelay(500);
          
          // 使用classAPI来获取信息，保持一致性
          const response = await classAPI.getClassById(id!);
          setClassInfo(response.data);
        } else {
          // 实际API调用
          const response = await axios.get(`/api/classes/${id}`);
          setClassInfo(response.data);
        }
      } catch (error) {
        console.error('获取班级信息失败', error);
        message.error('获取班级信息失败');
      }
    };

    fetchClassInfo();
  }, [id]);

  // 获取优秀学生
  useEffect(() => {
    const fetchTopStudents = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          await mockDelay(500);
          
          // 使用studentAPI获取学生数据
          const response = await studentAPI.getStudentsByClass(id!);
          const students = response.data;
          
          if (students && students.length > 0) {
            // 处理学生数据，计算总分并格式化
            const studentsWithTotalPoints = students.map((student: any) => ({
              id: student.id,
              name: student.name,
              studentId: student.studentId,
              group: student.group,
              disciplinePoints: student.points.discipline,
              hygienePoints: student.points.hygiene,
              academicPoints: student.points.academic,
              otherPoints: student.points.other,
              totalPoints: student.points.discipline + 
                         student.points.hygiene + 
                         student.points.academic + 
                         student.points.other
            }));
            
            // 按总积分排序
            studentsWithTotalPoints.sort((a: any, b: any) => b.totalPoints - a.totalPoints);
            
            setTopStudents(studentsWithTotalPoints);
          } else {
            setTopStudents([]);
          }
        } else {
          // 实际API调用
          const response = await axios.get(`/api/classes/${id}/students`);
          const students = response.data;
          
          if (students && students.length > 0) {
            // 计算每个学生的总分
            const studentsWithTotalPoints = students.map((student: any) => ({
              ...student,
              totalPoints: (student.disciplinePoints || 0) + 
                          (student.hygienePoints || 0) + 
                          (student.academicPoints || 0) + 
                          (student.otherPoints || 0)
            }));
            
            // 按总积分排序
            studentsWithTotalPoints.sort((a: any, b: any) => b.totalPoints - a.totalPoints);
            
            setTopStudents(studentsWithTotalPoints);
          } else {
            setTopStudents([]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('获取班级学生数据失败', error);
        message.error('获取学生数据失败');
        setLoading(false);
        setTopStudents([]);
      }
    };

    fetchTopStudents();
  }, [id]);

  // 获取积分摘要 - 基于实际学生数据计算
  useEffect(() => {
    const calculatePointsSummary = () => {
      if (!topStudents || topStudents.length === 0) return;
      
      try {
        // 初始化各类别的积分统计
        let disciplineTotal = 0;
        let hygieneTotal = 0;
        let academicTotal = 0;
        let otherTotal = 0;
        
        // 计算所有学生的积分总和
        topStudents.forEach(student => {
          disciplineTotal += student.disciplinePoints || 0;
          hygieneTotal += student.hygienePoints || 0;
          academicTotal += student.academicPoints || 0;
          otherTotal += student.otherPoints || 0;
        });
        
        // 假设所有添加的积分等于当前积分，减去的积分为0
        // 实际项目中可能需要从积分记录中计算
        const totalPoints = disciplineTotal + hygieneTotal + academicTotal + otherTotal;
        
        setPointsSummary({
          totalPoints,
          totalAddedPoints: totalPoints, // 简化处理，实际应从积分记录计算
          totalSubtractedPoints: 0,      // 简化处理，实际应从积分记录计算
          categorySummary: {
            discipline: { 
              total: disciplineTotal, 
              added: disciplineTotal,  // 简化处理
              subtracted: 0 
            },
            hygiene: { 
              total: hygieneTotal, 
              added: hygieneTotal,  // 简化处理
              subtracted: 0 
            },
            academic: { 
              total: academicTotal, 
              added: academicTotal,  // 简化处理
              subtracted: 0 
            },
            other: { 
              total: otherTotal, 
              added: otherTotal,  // 简化处理
              subtracted: 0 
            },
          },
        });
      } catch (error) {
        console.error('计算积分摘要失败', error);
      }
    };

    // 只有当学生数据加载完成后才计算积分摘要
    if (topStudents.length > 0) {
      calculatePointsSummary();
    }
  }, [topStudents]);

  // 获取小组摘要 - 基于实际学生数据计算
  useEffect(() => {
    const calculateGroupSummary = () => {
      if (!topStudents || topStudents.length === 0) return;
      
      try {
        // 按小组分组统计
        const groupMap = new Map();
        
        topStudents.forEach(student => {
          const groupName = student.group || '未分组';
          
          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {
              group: groupName,
              totalPoints: 0,
              studentCount: 0,
              categorySummary: {
                discipline: 0,
                hygiene: 0,
                academic: 0,
                other: 0
              }
            });
          }
          
          const groupData = groupMap.get(groupName);
          groupData.studentCount += 1;
          groupData.totalPoints += (student.disciplinePoints || 0) + 
                                  (student.hygienePoints || 0) + 
                                  (student.academicPoints || 0) + 
                                  (student.otherPoints || 0);
          groupData.categorySummary.discipline += student.disciplinePoints || 0;
          groupData.categorySummary.hygiene += student.hygienePoints || 0;
          groupData.categorySummary.academic += student.academicPoints || 0;
          groupData.categorySummary.other += student.otherPoints || 0;
        });
        
        // 计算每个小组的平均分
        groupMap.forEach(group => {
          group.averagePoints = group.studentCount > 0 ? group.totalPoints / group.studentCount : 0;
        });
        
        // 转换为数组并按总分排序
        const groups = Array.from(groupMap.values());
        groups.sort((a, b) => b.totalPoints - a.totalPoints);
        
        setGroupSummary(groups);
      } catch (error) {
        console.error('计算小组摘要失败', error);
      }
    };
    
    // 只有当学生数据加载完成后才计算小组摘要
    if (topStudents.length > 0) {
      calculateGroupSummary();
    }
  }, [topStudents]);

  // 获取每日趋势
  useEffect(() => {
    const fetchDailyTrends = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          await mockDelay(500);
          
          // 在模拟数据模式下，生成模拟的趋势数据
          const mockTrends: DailyTrend[] = [];
          
          // 生成过去30天的数据
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          
          for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            // 为每个日期生成1-4条记录
            const recordCount = 1 + Math.floor(Math.random() * 4);
            
            for (let i = 0; i < recordCount; i++) {
              const categories = ['discipline', 'hygiene', 'academic', 'other'];
              const category = categories[Math.floor(Math.random() * categories.length)];
              const actionType = Math.random() > 0.2 ? 'add' : 'subtract';
              const points = actionType === 'add' ? 3 + Math.floor(Math.random() * 8) : -(1 + Math.floor(Math.random() * 3));
              
              mockTrends.push({
                date: date.toISOString().split('T')[0],
                category: category,
                points: points,
                actionType: actionType as 'add' | 'subtract'
              });
            }
          }
          
          // 如果有类别过滤，应用过滤器
          const filteredTrends = pointsCategory === 'all' 
            ? mockTrends 
            : mockTrends.filter(trend => trend.category === pointsCategory);
          
          setDailyTrends(filteredTrends);
        } else {
          // 实际API调用
          const response = await axios.get(`/api/classes/${id}/points/logs`, {
            params: {
              startDate: dateRange[0].toISOString().split('T')[0],
              endDate: dateRange[1].toISOString().split('T')[0],
              category: pointsCategory !== 'all' ? pointsCategory : undefined,
            }
          });
          
          // 处理实际积分记录数据
          const pointsLogs = response.data;
          
          if (pointsLogs && pointsLogs.length > 0) {
            // 将积分记录转换为趋势数据格式
            const trends: DailyTrend[] = pointsLogs.map((log: any) => ({
              date: log.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              category: log.category || 'other',
              points: log.points || 0,
              actionType: log.points > 0 ? 'add' : 'subtract'
            }));
            
            setDailyTrends(trends);
          } else {
            setDailyTrends([]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('获取积分变化记录失败', error);
        message.error('获取积分记录失败');
        setLoading(false);
        
        // 发生错误时可以使用空数据
        setDailyTrends([]);
      }
    };

    fetchDailyTrends();
  }, [id, dateRange, pointsCategory]);

  // 添加模拟延迟函数用于模拟数据模式
  const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 添加USE_MOCK_DATA常量，确保与api.ts保持一致
  const USE_MOCK_DATA = true;

  // 处理返回按钮点击
  const handleGoBack = () => {
    navigate(`/class/${id}`);
  };

  // 处理导出按钮点击
  const handleExport = () => {
    // 实际开发中需要实现导出功能
    console.log('导出数据', { dateRange, pointsCategory });
  };

  // 获取类别名称
  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'discipline': return '纪律分';
      case 'hygiene': return '卫生分';
      case 'academic': return '学术分';
      case 'other': return '其他分';
      default: return category;
    }
  };

  // 获取分类颜色
  const getCategoryColor = (category: string): string => {
    return categoryColors[category as keyof typeof categoryColors] || '#d9d9d9';
  };

  // 添加renderChart函数来处理图表渲染
  const renderChart = (type: string, data: any[]) => {
    if (!data || data.length === 0) {
      return <Empty description="暂无数据" />;
    }
    
    // 分组对比图表
    if (type === 'groupComparison') {
      return (
        <div className="chart-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>小组</th>
                <th>总积分</th>
                <th>平均积分</th>
                <th>学生数</th>
              </tr>
            </thead>
            <tbody>
              {data.map((group, index) => (
                <tr key={index}>
                  <td>{group.group}</td>
                  <td>{group.totalPoints || 0}</td>
                  <td>{(group.averagePoints || 0).toFixed(1)}</td>
                  <td>{group.studentCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // 默认表格
    return (
      <div className="chart-container">
        <table className="simple-table">
          <thead>
            <tr>
              {Object.keys(data[0] || {}).map(key => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {Object.entries(item).map(([key, value], i) => (
                  <td key={i}>{value !== undefined && value !== null ? value.toString() : "0"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染班级概览
  const renderOverview = () => {
    if (loading && !classInfo && !pointsSummary) {
      return <Spin size="large" className="page-loading" />;
    }

    // 确保班级信息已加载
    if (!classInfo) {
      return <Empty description="班级信息加载中..." />;
    }
    
    // 计算各项汇总数据
    // 如果pointsSummary未加载完成，使用topStudents计算
    let disciplineTotal = 0;
    let hygieneTotal = 0;
    let academicTotal = 0;
    let otherTotal = 0;
    let totalPoints = 0;
    
    if (topStudents && topStudents.length > 0) {
      disciplineTotal = topStudents.reduce((sum, student) => sum + (student.disciplinePoints || 0), 0);
      hygieneTotal = topStudents.reduce((sum, student) => sum + (student.hygienePoints || 0), 0);
      academicTotal = topStudents.reduce((sum, student) => sum + (student.academicPoints || 0), 0);
      otherTotal = topStudents.reduce((sum, student) => sum + (student.otherPoints || 0), 0);
      totalPoints = disciplineTotal + hygieneTotal + academicTotal + otherTotal;
    } else if (pointsSummary) {
      disciplineTotal = pointsSummary.categorySummary.discipline.total || 0;
      hygieneTotal = pointsSummary.categorySummary.hygiene.total || 0;
      academicTotal = pointsSummary.categorySummary.academic.total || 0;
      otherTotal = pointsSummary.categorySummary.other.total || 0;
      totalPoints = pointsSummary.totalPoints || 0;
    }
    
    // 避免除零错误
    totalPoints = totalPoints || 1;
    
    const disciplinePercent = Math.round((disciplineTotal / totalPoints) * 100);
    const hygienePercent = Math.round((hygieneTotal / totalPoints) * 100);
    const academicPercent = Math.round((academicTotal / totalPoints) * 100);
    const otherPercent = Math.round((otherTotal / totalPoints) * 100);
    
    // 计算小组数量
    const groupsSet = new Set<string>();
    if (topStudents && topStudents.length > 0) {
      topStudents.forEach(student => {
        if (student.group) {
          groupsSet.add(student.group);
        }
      });
    }
    const groupCount = groupsSet.size;

    return (
      <>
        <Row gutter={16}>
          <Col span={8}>
            <Card className="class-info-card">
              <div className="class-name">{classInfo.name}</div>
              {classInfo.description && <div className="class-description">{classInfo.description}</div>}
              <Divider />
              <div className="class-stats">
                <div className="stat-item">
                  <div className="stat-label">学生数量:</div>
                  <div className="stat-value">{topStudents.length || 0}人</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">小组数量:</div>
                  <div className="stat-value">{groupCount || 0}组</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">总积分:</div>
                  <div className="stat-value">{totalPoints || 0}分</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">人均积分:</div>
                  <div className="stat-value">
                    {topStudents.length ? Math.round(totalPoints / topStudents.length) : 0}分
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <Card title="积分组成" className="points-distribution-card">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>纪律分</span>
                      <span>{disciplineTotal}分 ({disciplinePercent}%)</span>
                    </div>
                    <Progress percent={disciplinePercent} strokeColor="#1890ff" />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>卫生分</span>
                      <span>{hygieneTotal}分 ({hygienePercent}%)</span>
                    </div>
                    <Progress percent={hygienePercent} strokeColor="#52c41a" />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>学术分</span>
                      <span>{academicTotal}分 ({academicPercent}%)</span>
                    </div>
                    <Progress percent={academicPercent} strokeColor="#fa8c16" />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>其他分</span>
                      <span>{otherTotal}分 ({otherPercent}%)</span>
                    </div>
                    <Progress percent={otherPercent} strokeColor="#722ed1" />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        
        <Card title="积分分类分析" className="chart-card" style={{ marginTop: '16px' }}>
          {renderCategorySummaryChart('column')}
        </Card>

        <Card title="积分排行榜" className="chart-card" style={{ marginTop: '16px' }}>
          <Table
            dataSource={topStudents}
            pagination={false}
            rowClassName={(record, index) => {
              if (index === 0) return 'first-place';
              if (index === 1) return 'second-place';
              if (index === 2) return 'third-place';
              return '';
            }}
            columns={[
              {
                title: '排名',
                key: 'rank',
                render: (_text, _record, index) => index + 1,
                width: 60,
              },
              {
                title: '学号',
                dataIndex: 'studentId',
                key: 'studentId',
              },
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '分组',
                dataIndex: 'group',
                key: 'group',
                render: (text) => text || '未分组',
              },
              {
                title: '纪律分',
                dataIndex: 'disciplinePoints',
                key: 'disciplinePoints',
                render: (text) => text || 0,
              },
              {
                title: '卫生分',
                dataIndex: 'hygienePoints',
                key: 'hygienePoints',
                render: (text) => text || 0,
              },
              {
                title: '学术分',
                dataIndex: 'academicPoints',
                key: 'academicPoints',
                render: (text) => text || 0,
              },
              {
                title: '其他分',
                dataIndex: 'otherPoints',
                key: 'otherPoints',
                render: (text) => text || 0,
              },
              {
                title: '总积分',
                dataIndex: 'totalPoints',
                key: 'totalPoints',
                render: (text) => <span className="total-points">{text || 0}</span>,
                sorter: (a, b) => (a.totalPoints || 0) - (b.totalPoints || 0),
                sortDirections: ['descend'],
                defaultSortOrder: 'descend',
              },
            ]}
          />
        </Card>
      </>
    );
  };

  // 添加 renderCategorySummaryChart 函数
  const renderCategorySummaryChart = (type: string): React.ReactNode => {
    if (!topStudents || topStudents.length === 0) {
      return <Empty description="暂无数据" />;
    }
    
    // 准备四个分类的数据
    let disciplineTotal = 0;
    let hygieneTotal = 0;
    let academicTotal = 0;
    let otherTotal = 0;
    
    topStudents.forEach(student => {
      disciplineTotal += student.disciplinePoints || 0;
      hygieneTotal += student.hygienePoints || 0;
      academicTotal += student.academicPoints || 0;
      otherTotal += student.otherPoints || 0;
    });
    
    const chartData: CategoryData[] = [
      {
        category: 'discipline',
        total: disciplineTotal,
        added: disciplineTotal, // 简化，实际应从记录中计算
        subtracted: 0
      },
      {
        category: 'hygiene',
        total: hygieneTotal,
        added: hygieneTotal,
        subtracted: 0
      },
      {
        category: 'academic',
        total: academicTotal,
        added: academicTotal,
        subtracted: 0
      },
      {
        category: 'other',
        total: otherTotal,
        added: otherTotal,
        subtracted: 0
      }
    ];
    
    // 如果是饼图
    if (type === 'pie') {
      const totalSum = chartData.reduce((sum, item) => sum + (item.total || 0), 0) || 1;
      
      return (
        <div className="chart-container">
          <div className="pie-chart">
            <div className="chart-header">积分分类占比</div>
            <div className="pie-segments">
              {chartData.map((item, index) => {
                const percentage = ((item.total || 0) / totalSum) * 100;
                const offset = chartData.slice(0, index).reduce((sum, cat) => 
                  sum + ((cat.total || 0) / totalSum) * 360, 0);
                
                return (
                  <div 
                    key={index}
                    className="pie-segment"
                    style={{
                      backgroundColor: getCategoryColor(item.category),
                      background: `conic-gradient(${getCategoryColor(item.category)} ${offset}deg, ${getCategoryColor(item.category)} ${offset + (percentage * 3.6)}deg, transparent ${offset + (percentage * 3.6)}deg)`,
                    }}
                    title={`${getCategoryName(item.category)}: ${item.total}分 (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="pie-legend">
              {chartData.map((item, index) => {
                const percentage = ((item.total || 0) / totalSum) * 100;
                return (
                  <div key={index} className="legend-item">
                    <div className="color-dot" style={{ backgroundColor: getCategoryColor(item.category) }}></div>
                    <span>{getCategoryName(item.category)}: {item.total}分 ({percentage.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // 默认柱状图
    if (type === 'column') {
      // 确保所有值都有效，防止出现NaN
      const maxValue = Math.max(
        ...chartData.map(item => Math.max(item.total || 0, item.added || 0, item.subtracted || 0))
      ) || 300; // 默认最大值为300，避免除以0
      
      return (
        <div className="chart-container">
          <div className="column-chart">
            <div className="chart-header">积分分类对比</div>
            <div className="chart-content">
              {chartData.map((item, index) => {
                const heightPercent = ((item.total || 0) / maxValue) * 100;
                
                return (
                  <div key={index} className="column-wrapper">
                    <div 
                      className="column-bar" 
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: getCategoryColor(item.category)
                      }}
                      title={`${getCategoryName(item.category)}: ${item.total}分`}
                    >
                      <span className="bar-value">{item.total}</span>
                    </div>
                    <div className="column-label">{getCategoryName(item.category)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // 默认表格显示
    return (
      <div className="chart-container">
        <table className="simple-table">
          <thead>
            <tr>
              <th>类别</th>
              <th>总分</th>
              <th>加分</th>
              <th>减分</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => (
              <tr key={index}>
                <td>{getCategoryName(item.category)}</td>
                <td>{item.total}</td>
                <td>{item.added}</td>
                <td>{item.subtracted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染分组统计
  const renderGroupStatistics = () => {
    if (loading && !groupSummary.length) {
      return <Spin size="large" className="page-loading" />;
    }

    if (groupSummary.length === 0 && topStudents.length > 0) {
      // 如果有学生数据但无分组摘要，即时计算
      const groupMap = new Map();
      
      topStudents.forEach(student => {
        const groupName = student.group || '未分组';
        
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, {
            group: groupName,
            totalPoints: 0,
            studentCount: 0,
            categorySummary: {
              discipline: 0,
              hygiene: 0,
              academic: 0,
              other: 0
            }
          });
        }
        
        const groupData = groupMap.get(groupName);
        groupData.studentCount += 1;
        groupData.totalPoints += (student.totalPoints || 0);
        groupData.categorySummary.discipline += student.disciplinePoints || 0;
        groupData.categorySummary.hygiene += student.hygienePoints || 0;
        groupData.categorySummary.academic += student.academicPoints || 0;
        groupData.categorySummary.other += student.otherPoints || 0;
      });
      
      // 计算每个小组的平均分
      groupMap.forEach(group => {
        group.averagePoints = group.studentCount > 0 ? group.totalPoints / group.studentCount : 0;
      });
      
      // 转换为数组并按总分排序
      return renderGroupData(Array.from(groupMap.values()).sort((a, b) => b.totalPoints - a.totalPoints));
    }

    if (groupSummary.length === 0) {
      return <Empty description="暂无分组数据" />;
    }

    return renderGroupData(groupSummary);
  };

  // 提取渲染分组数据的函数
  const renderGroupData = (groups: GroupSummary[]) => {
    return (
      <div className="group-statistics-container">
        <Card title="分组积分对比" className="chart-card">
          <div className="chart-container">
            <div className="column-chart">
              <div className="chart-content">
                {groups.map((group, index) => {
                  const maxPoints = Math.max(...groups.map(g => g.totalPoints || 0), 1);
                  const heightPercent = ((group.totalPoints || 0) / maxPoints) * 100;
                  
                  return (
                    <div key={index} className="column-wrapper" style={{ width: `${100 / Math.min(groups.length, 8)}%` }}>
                      <div 
                        className="column-bar" 
                        style={{ 
                          height: `${heightPercent}%`,
                          backgroundColor: `hsl(${index * 30}, 70%, 60%)`
                        }}
                        title={`${group.group}: ${group.totalPoints || 0}分`}
                      >
                        <span className="bar-value">{group.totalPoints || 0}</span>
                      </div>
                      <div className="column-label">{group.group}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card title="分组分析" className="chart-card" style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card className="inner-card" title="平均分排名">
                <Table
                  dataSource={[...groups].sort((a, b) => (b.averagePoints || 0) - (a.averagePoints || 0))}
                  rowKey="group"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '排名',
                      key: 'rank',
                      render: (_text, _record, index) => index + 1,
                      width: 60,
                    },
                    {
                      title: '分组',
                      dataIndex: 'group',
                      key: 'group',
                    },
                    {
                      title: '平均分',
                      dataIndex: 'averagePoints',
                      key: 'averagePoints',
                      render: (text) => <span>{text ? text.toFixed(1) : "0.0"}</span>,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card className="inner-card" title="学生数量">
                <Table
                  dataSource={[...groups].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))}
                  rowKey="group"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '排名',
                      key: 'rank',
                      render: (_text, _record, index) => index + 1,
                      width: 60,
                    },
                    {
                      title: '分组',
                      dataIndex: 'group',
                      key: 'group',
                    },
                    {
                      title: '学生数',
                      dataIndex: 'studentCount',
                      key: 'studentCount',
                      render: (text) => `${text || 0}人`,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="分组详情" className="chart-card" style={{ marginTop: '16px' }}>
          <Table
            dataSource={groups}
            rowKey="group"
            pagination={false}
            columns={[
              {
                title: '排名',
                key: 'rank',
                render: (_text, _record, index) => index + 1,
                width: 60,
              },
              {
                title: '分组',
                dataIndex: 'group',
                key: 'group',
              },
              {
                title: '学生数',
                dataIndex: 'studentCount',
                key: 'studentCount',
                render: (text) => text || 0,
              },
              {
                title: '纪律分',
                dataIndex: ['categorySummary', 'discipline'],
                key: 'discipline',
                render: (text) => text || 0,
              },
              {
                title: '卫生分',
                dataIndex: ['categorySummary', 'hygiene'],
                key: 'hygiene',
                render: (text) => text || 0,
              },
              {
                title: '学术分',
                dataIndex: ['categorySummary', 'academic'],
                key: 'academic',
                render: (text) => text || 0,
              },
              {
                title: '其他分',
                dataIndex: ['categorySummary', 'other'],
                key: 'other',
                render: (text) => text || 0,
              },
              {
                title: '总积分',
                dataIndex: 'totalPoints',
                key: 'totalPoints',
                render: (text) => <span className="total-points">{text || 0}</span>,
                sorter: (a, b) => (a.totalPoints || 0) - (b.totalPoints || 0),
                defaultSortOrder: 'descend',
              },
              {
                title: '平均分',
                dataIndex: 'averagePoints',
                key: 'averagePoints',
                render: (text) => <span>{text ? text.toFixed(1) : "0.0"}</span>,
              },
            ]}
          />
        </Card>
      </div>
    );
  };

  // 渲染趋势分析内容
  const renderTrendsContent = (): React.ReactNode => {
    if (loading && !dailyTrends.length) {
      return <Spin size="large" className="page-loading" />;
    }

    return (
      <div className="trends-container">
        <div className="filter-bar">
          <Space>
            <DatePicker.RangePicker 
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].toDate(), dates[1].toDate()]);
                }
              }}
            />
            <Select 
              value={pointsCategory}
              onChange={setPointsCategory}
              style={{ width: 120 }}
            >
              <Option value="all">所有类别</Option>
              <Option value="discipline">纪律分</Option>
              <Option value="hygiene">卫生分</Option>
              <Option value="academic">学术分</Option>
              <Option value="other">其他分</Option>
            </Select>
          </Space>
        </div>

        <Card title="积分趋势分析" className="chart-card">
          {renderTrends(dailyTrends)}
        </Card>
        
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={12}>
            <Card title="积分类别分布" className="chart-card">
              {renderCategoryDistribution()}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="积分增减统计" className="chart-card">
              {renderAddSubtractStats()}
            </Card>
          </Col>
        </Row>
        
        <Card title="积分详细记录" className="chart-card" style={{ marginTop: '16px' }}>
          <Table
            dataSource={dailyTrends}
            rowKey={(record, index) => `${record.date}-${index}`}
            pagination={false}
            columns={[
              {
                title: '日期',
                dataIndex: 'date',
                key: 'date',
                sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                defaultSortOrder: 'descend',
              },
              {
                title: '积分类别',
                dataIndex: 'category',
                key: 'category',
                render: (text) => getCategoryName(text),
              },
              {
                title: '积分变动',
                dataIndex: 'points',
                key: 'points',
                render: (points) => (
                  <span style={{ color: points > 0 ? '#52c41a' : '#f5222d' }}>
                    {points > 0 ? `+${points}` : points}
                  </span>
                ),
              },
              {
                title: '操作类型',
                dataIndex: 'actionType',
                key: 'actionType',
                render: (text) => (
                  <span style={{ color: text === 'add' ? '#52c41a' : '#f5222d' }}>
                    {text === 'add' ? '加分' : '减分'}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>
    );
  };

  // 渲染积分类别分布
  const renderCategoryDistribution = () => {
    if (!dailyTrends || dailyTrends.length === 0) {
      return <Empty description="暂无数据" />;
    }
    
    const categoryMap = new Map<string, number>();
    dailyTrends.forEach(item => {
      const category = item.category;
      const points = Math.abs(Number(item.points) || 0);
      categoryMap.set(category, (categoryMap.get(category) || 0) + points);
    });
    
    const chartData = Array.from(categoryMap.entries()).map(([category, points]) => ({
      category,
      points
    }));
    
    const totalPoints = chartData.reduce((sum, item) => sum + item.points, 0) || 1;
    
    return (
      <div className="chart-container">
        <div className="pie-chart">
          <div className="chart-header">积分类别分布</div>
          <div className="pie-segments">
            {chartData.map((item, index) => {
              const percentage = (item.points / totalPoints) * 100;
              const offset = chartData.slice(0, index).reduce((sum, data) => 
                sum + (data.points / totalPoints) * 360, 0);
              
              return (
                <div 
                  key={index}
                  className="pie-segment"
                  style={{
                    backgroundColor: getCategoryColor(item.category),
                    background: `conic-gradient(${getCategoryColor(item.category)} ${offset}deg, ${getCategoryColor(item.category)} ${offset + (percentage * 3.6)}deg, transparent ${offset + (percentage * 3.6)}deg)`,
                  }}
                  title={`${getCategoryName(item.category)}: ${item.points}分 (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="pie-legend">
            {chartData.map((item, index) => {
              const percentage = (item.points / totalPoints) * 100;
              return (
                <div key={index} className="legend-item">
                  <div className="color-dot" style={{ backgroundColor: getCategoryColor(item.category) }}></div>
                  <span>{getCategoryName(item.category)}: {item.points}分 ({percentage.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染积分增减统计
  const renderAddSubtractStats = () => {
    if (!dailyTrends || dailyTrends.length === 0) {
      return <Empty description="暂无数据" />;
    }
    
    let totalAdded = 0;
    let totalSubtracted = 0;
    
    dailyTrends.forEach(item => {
      if (item.actionType === 'add') {
        totalAdded += Number(item.points) || 0;
      } else {
        totalSubtracted += Math.abs(Number(item.points) || 0);
      }
    });
    
    const total = totalAdded + totalSubtracted || 1;
    const addedPercentage = (totalAdded / total) * 100;
    const subtractedPercentage = (totalSubtracted / total) * 100;
    
    return (
      <div className="chart-container">
        <div className="stats-summary">
          <div className="stats-item">
            <div className="stats-title">总积分变动</div>
            <div className="stats-value">{total}分</div>
          </div>
          <Divider type="vertical" style={{ height: '50px' }} />
          <div className="stats-item">
            <div className="stats-title">加分</div>
            <div className="stats-value" style={{ color: '#52c41a' }}>+{totalAdded}分</div>
            <div className="stats-percent">({addedPercentage.toFixed(1)}%)</div>
          </div>
          <Divider type="vertical" style={{ height: '50px' }} />
          <div className="stats-item">
            <div className="stats-title">减分</div>
            <div className="stats-value" style={{ color: '#f5222d' }}>-{totalSubtracted}分</div>
            <div className="stats-percent">({subtractedPercentage.toFixed(1)}%)</div>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <div className="progress-label">
            <span>加分/减分比例</span>
          </div>
          <Progress 
            percent={addedPercentage} 
            success={{ percent: addedPercentage }}
            trailColor="#f5222d"
            format={() => `${addedPercentage.toFixed(1)}% / ${subtractedPercentage.toFixed(1)}%`}
          />
        </div>
      </div>
    );
  };

  // 渲染趋势图表 - 只保留柱状图
  const renderTrends = (trendData: any[]): React.ReactNode => {
    if (!trendData || trendData.length === 0) {
      return <Empty description="暂无数据" />;
    }
    
    // 处理趋势数据，按日期分组并计算每天总分
    const groupedByDate: Record<string, {date: string, totalPoints: number}> = {};
    trendData.forEach(item => {
      const date = item.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, totalPoints: 0 };
      }
      // 根据操作类型添加或减少积分
      const points = Number(item.points) || 0;
      if (item.actionType === 'add') {
        groupedByDate[date].totalPoints += points;
      } else if (item.actionType === 'subtract') {
        groupedByDate[date].totalPoints -= points;
      }
    });
    
    // 转换为数组并排序
    const processedData = Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // 柱状图
    const maxPoints = Math.max(...processedData.map(item => Math.max(0, item.totalPoints || 0)), 1);
    
    return (
      <div className="chart-container">
        <div className="column-chart">
          <div className="chart-header">积分趋势对比</div>
          <div className="chart-content">
            {processedData.map((record, index) => {
              const totalPoints = Math.max(0, record.totalPoints || 0);
              const heightPercent = (totalPoints / (maxPoints * 1.2)) * 100;
              const date = record.date ? record.date.replace(/^\d{4}-(\d{2})-(\d{2}).*$/, '$2/$1') : '';
              
              return (
                <div key={index} className="column-wrapper">
                  <div 
                    className="column-bar" 
                    style={{ 
                      height: `${heightPercent}%`,
                      backgroundColor: `hsl(${index * 30}, 70%, 60%)`
                    }}
                    title={`${date}: ${totalPoints}分`}
                  >
                    <span className="bar-value">{totalPoints}</span>
                  </div>
                  <div className="column-label">{date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 更新渲染Tab内容函数
  const renderTabContent = (): React.ReactNode => {
    switch (activeTabKey) {
      case 'overview':
        return renderOverview();
      case 'groups':
        return renderGroupStatistics();
      case 'trends':
        return renderTrendsContent();
      default:
        return <Empty description="暂无数据" />;
    }
  };

  return (
    <div className="statistics-container">
      <div className="page-header">
        <div className="header-left">
          <Button
            icon={<RollbackOutlined />}
            onClick={handleGoBack}
            style={{ marginRight: '16px' }}
          >
            返回班级
          </Button>
          <Title level={4}>{classInfo?.name || '加载中...'} - 班级数据统计</Title>
        </div>
        <div className="header-right">
          <Space>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出报告
            </Button>
          </Space>
        </div>
      </div>
      
      <Card 
        className="tab-card"
        tabList={tabs}
        activeTabKey={activeTabKey}
        onTabChange={key => setActiveTabKey(key)}
      >
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : renderTabContent()}
      </Card>
    </div>
  );
};

export default Statistics; 