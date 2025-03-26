import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Card,
  Tabs,
  Tooltip,
  Dropdown,
  Badge,
  Row,
  Col,
  Upload,
  Menu,
  Divider,
  Radio,
  FormInstance,
  Empty,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  TeamOutlined,
  SettingOutlined,
  ExportOutlined,
  ReloadOutlined,
  MoreOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UsergroupAddOutlined,
  GiftOutlined,
  LineChartOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  TrophyFilled,
  InboxOutlined
} from '@ant-design/icons';
import { classAPI, studentAPI } from '../services/api';
import './ClassDetail.css';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';
import type { SortOrder } from 'antd/es/table/interface';
import { persistData } from '../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Dragger } = Upload;

interface ClassData {
  id: string;
  name: string;
  description?: string;
}

interface StudentData {
  id: string;
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
  totalPoints?: number;
  isCompactView?: boolean; // 添加标记是否为简化视图的属性
}

// 新增积分变动日志接口
interface PointLog {
  id: string;
  studentId: string;
  category: 'discipline' | 'hygiene' | 'academic' | 'other';
  pointItem: string;
  points: number;
  reason: string;
  actionType: 'add' | 'subtract';
  createdAt: string;
  operator?: string;
}

// 将 getPointItemName 函数移到组件外部
const getPointItemName = (category: string, item: string, pointItemOptions: any): string => {
  const items = pointItemOptions[category as keyof typeof pointItemOptions];
  if (!items) return item;
  const foundItem = items.find((i: any) => i.value === item);
  return foundItem ? foundItem.label : item;
};

// 添加一个更可靠的洗牌函数
const shuffleArray = (array: any[]) => {
  // 复制数组避免修改原数组
  const shuffled = [...array];
  // Fisher-Yates (Knuth) 洗牌算法
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 随机选择一个位置
    const j = Math.floor(Math.random() * (i + 1));
    // 交换元素
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [batchPointsModalVisible, setBatchPointsModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentForm] = Form.useForm();
  const [pointsForm] = Form.useForm();
  const [batchPointsForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [importFile, setImportFile] = useState<UploadFile | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const uploadRef = useRef<any>(null);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [pointsLogModalVisible, setPointsLogModalVisible] = useState(false);
  const [currentStudentForLogs, setCurrentStudentForLogs] = useState<StudentData | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [categoryForPointsModal, setCategoryForPointsModal] = useState<string>('');
  const [categoryForBatchModal, setCategoryForBatchModal] = useState<string>('');
  const [forceRender, setForceRender] = useState<number>(0);
  // 添加随机抽取学生相关状态
  const [randomPickModalVisible, setRandomPickModalVisible] = useState<boolean>(false);
  const [randomPickCount, setRandomPickCount] = useState<number>(1);
  const [randomPickedStudents, setRandomPickedStudents] = useState<StudentData[]>([]);
  const [isPickAnimating, setIsPickAnimating] = useState<boolean>(false);
  const [randomPickGroupFilter, setRandomPickGroupFilter] = useState<string>('all');
  // 添加状态来存储实际的积分项目
  const [actualPointItems, setActualPointItems] = useState<{
    discipline: Array<{value: string, label: string}>,
    hygiene: Array<{value: string, label: string}>,
    academic: Array<{value: string, label: string}>,
    other: Array<{value: string, label: string}>
  }>({
    discipline: [],
    hygiene: [],
    academic: [],
    other: []
  });
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [rollingStudents, setRollingStudents] = useState<StudentData[]>([]);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  // 在state声明区添加一个新的状态
  const [overrideExisting, setOverrideExisting] = useState<boolean>(false);

  // 积分项目的定义
  const pointItemOptions = {
    discipline: [
      { value: 'discipline_attendance', label: '出勤表现' },
      { value: 'discipline_behavior', label: '课堂行为' },
      { value: 'discipline_uniform', label: '着装规范' },
      { value: 'discipline_other', label: '其他纪律' }
    ],
    hygiene: [
      { value: 'hygiene_desk', label: '桌面整洁' },
      { value: 'hygiene_floor', label: '地面清洁' },
      { value: 'hygiene_duty', label: '值日表现' },
      { value: 'hygiene_other', label: '其他卫生' }
    ],
    academic: [
      { value: 'academic_homework', label: '作业完成' },
      { value: 'academic_quiz', label: '测验成绩' },
      { value: 'academic_participation', label: '课堂参与' },
      { value: 'academic_other', label: '其他学习' }
    ],
    other: [
      { value: 'other_activities', label: '活动参与' },
      { value: 'other_volunteer', label: '志愿服务' },
      { value: 'other_special', label: '特殊贡献' }
    ]
  };

  useEffect(() => {
    if (id) {
      fetchClassInfo();
      fetchStudents();
      fetchPointItems(); // 获取积分项目
    }
  }, [id]);

  const fetchClassInfo = async () => {
    try {
      const response = await classAPI.getClassById(id!);
      setClassInfo(response.data);
    } catch (error) {
      message.error('获取班级信息失败');
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getStudentsByClass(id!);
      setStudents(response.data);
    } catch (error) {
      message.error('获取学生列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    studentForm.resetFields();
    setStudentModalVisible(true);
  };

  const handleEditStudent = (student: StudentData) => {
    setEditingStudent(student);
    studentForm.setFieldsValue({
      studentId: student.studentId,
      name: student.name,
      group: student.group,
    });
    setStudentModalVisible(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除学生将同时删除其所有积分记录，确定要删除吗？',
      onOk: async () => {
        try {
          await studentAPI.deleteStudent(studentId);
          message.success('学生删除成功');
          fetchStudents();
        } catch (error) {
          message.error('删除学生失败');
          console.error(error);
        }
      },
    });
  };

  const handleStudentFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      if (USE_MOCK_DATA) {
        // 模拟数据模式下的处理
        await mockDelay(1000);
        
        if (editingStudent) {
          // 更新现有学生
          const updatedStudents = students.map(student => {
            if (student.id === editingStudent.id) {
              return {
                ...student,
                studentId: values.studentId,
                name: values.name,
                group: values.group || undefined
              };
            }
            return student;
          });
          setStudents(updatedStudents);
          message.success('学生信息更新成功');
        } else {
          // 添加新学生
          const newStudent: StudentData = {
            id: `student_${Date.now()}`,
            studentId: values.studentId,
            name: values.name,
            group: values.group || undefined,
            points: {
              discipline: 0,
              hygiene: 0,
              academic: 0,
              other: 0
            },
            exchangeCoins: 0
          };
          
          setStudents([...students, newStudent]);
          message.success('学生添加成功');
        }
      } else {
        // 真实API调用
        if (editingStudent) {
          await studentAPI.updateStudent(editingStudent.id, values);
          message.success('学生信息更新成功');
        } else {
          await studentAPI.createStudent({
            ...values,
            classId: id!,
          });
          message.success('学生添加成功');
        }
        fetchStudents();
      }
      
      setStudentModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePointsModalOpen = (student: StudentData) => {
    setEditingStudent(student);
    // 重置表单并设置初始值
    pointsForm.resetFields();
    // 重置类别状态变量
    setCategoryForPointsModal('');
    // 确保表单依赖项正确触发
    setTimeout(() => {
      setPointsModalVisible(true);
    }, 0);
  };

  const handlePointsFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      if (USE_MOCK_DATA) {
        // 模拟数据模式下的处理
        await mockDelay(1000);
        
        if (!editingStudent) {
          message.error('未选择学生');
          return;
        }
        
        // 更新学生积分
        const updatedStudents = students.map(student => {
          if (student.id === editingStudent.id) {
            // 创建学生的副本
            const updatedStudent = { ...student };
            const typedCategory = values.category as 'discipline' | 'hygiene' | 'academic' | 'other';
            const pointsValue = parseInt(values.points);
            
            // 更新积分和兑换币
            if (values.actionType === 'add') {
              updatedStudent.points[typedCategory] += pointsValue;
              updatedStudent.exchangeCoins += pointsValue; // 积分增加，兑换币同步增加
            } else if (values.actionType === 'subtract') {
              const previousPoints = updatedStudent.points[typedCategory];
              updatedStudent.points[typedCategory] = Math.max(0, updatedStudent.points[typedCategory] - pointsValue);
              const actualDeduction = previousPoints - updatedStudent.points[typedCategory];
              updatedStudent.exchangeCoins = Math.max(0, updatedStudent.exchangeCoins - actualDeduction); // 积分减少，兑换币同步减少
            }
            
            // 添加积分日志
            addPointLog(updatedStudent, values);
            
            return updatedStudent;
          }
          return student;
        });
        
        setStudents(updatedStudents);
        message.success('积分更新成功');
      } else {
        // 真实API调用
        await studentAPI.updateStudentPoints(editingStudent!.id, values);
        message.success('积分更新成功');
        fetchStudents();
      }
      
      setPointsModalVisible(false);
      // 重置类别状态变量
      setCategoryForPointsModal('');
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleBatchPointsModalOpen = () => {
    if (selectedStudents.length === 0) {
      message.warning('请先选择学生');
      return;
    }
    // 重置表单并确保依赖项正确触发
    batchPointsForm.resetFields();
    // 重置类别状态变量
    setCategoryForBatchModal('');
    setTimeout(() => {
      setBatchPointsModalVisible(true);
    }, 0);
  };

  const handleBatchPointsFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      if (USE_MOCK_DATA) {
        // 模拟数据模式下的处理
        await mockDelay(1000);
        
        // 更新模拟数据
        const updatedStudents = [...students];
        const typedCategory = values.category as 'discipline' | 'hygiene' | 'academic' | 'other';
        const pointsValue = parseInt(values.points);
        
        for (const student of updatedStudents) {
          if (selectedStudents.includes(student.id)) {
            if (values.actionType === 'add') {
              student.points[typedCategory] += pointsValue;
              student.exchangeCoins += pointsValue; // 积分增加，兑换币同步增加
              
              // 记录积分变动日志
              addPointLog(student, values);
            } else if (values.actionType === 'subtract') {
              const previousPoints = student.points[typedCategory];
              student.points[typedCategory] = Math.max(0, student.points[typedCategory] - pointsValue);
              const actualDeduction = previousPoints - student.points[typedCategory];
              student.exchangeCoins = Math.max(0, student.exchangeCoins - actualDeduction); // 积分减少，兑换币同步减少
              
              // 只有实际扣减积分时才记录日志
              if (actualDeduction > 0) {
                // 记录积分变动日志
                addPointLog(student, {
                  ...values,
                  points: actualDeduction // 使用实际扣减的分数
                });
              }
            }
          }
        }
        setStudents(updatedStudents);
        message.success(`成功更新 ${selectedStudents.length} 名学生的积分`);
        setSelectedStudents([]);
      } else {
        // 真实API调用
        await studentAPI.batchUpdatePoints(id!, {
          ...values,
          studentIds: selectedStudents,
        });
        message.success('批量积分更新成功');
        setSelectedStudents([]);
        fetchStudents();
      }
      
      setBatchPointsModalVisible(false);
      // 重置类别状态变量
      setCategoryForBatchModal('');
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  // 添加模拟延迟函数用于模拟数据模式
  const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 添加USE_MOCK_DATA常量，确保与api.ts保持一致
  const USE_MOCK_DATA = true;

  const handleExportData = () => {
    // 这里实现导出数据功能
    message.info('导出功能开发中...');
  };

  const filteredStudents = () => {
    if (activeTab === 'all') {
      return students;
    }
    return students.filter(student => student.group === activeTab);
  };

  const groupTabs = () => {
    const groups = Array.from(new Set(students.filter(s => s.group).map(s => s.group)));
    
    return (
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="group-tabs"
        type="card"
        tabBarExtraContent={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchStudents}
              title="刷新数据"
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddStudent}
            >
              添加学生
            </Button>
          </Space>
        }
      >
        <TabPane tab="全部" key="all" />
        {groups.map(group => (
          <TabPane tab={group} key={group!} />
        ))}
      </Tabs>
    );
  };

  // 生成表格列配置
  const columns = [
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
      width: 120,
      render: (text: string) => text || '未分组',
      filters: Array.from(new Set(students.filter(s => s.group).map(s => s.group)))
        .map(group => ({
          text: group || '未分组',
          value: group || '',
        })),
      onFilter: (value: any, record: StudentData) => record.group === value || (!record.group && value === ''),
    },
    {
      title: '纪律分',
      dataIndex: ['points', 'discipline'],
      key: 'discipline',
      width: 100,
      sorter: (a: StudentData, b: StudentData) => a.points.discipline - b.points.discipline,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '卫生分',
      dataIndex: ['points', 'hygiene'],
      key: 'hygiene',
      width: 100,
      sorter: (a: StudentData, b: StudentData) => a.points.hygiene - b.points.hygiene,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '学术分',
      dataIndex: ['points', 'academic'],
      key: 'academic',
      width: 100,
      sorter: (a: StudentData, b: StudentData) => a.points.academic - b.points.academic,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '其他分',
      dataIndex: ['points', 'other'],
      key: 'other',
      width: 100,
      sorter: (a: StudentData, b: StudentData) => a.points.other - b.points.other,
      sortDirections: ['descend', 'ascend'] as SortOrder[],
    },
    {
      title: '总积分',
      key: 'totalPoints',
      width: 100,
      render: (_: React.ReactNode, record: StudentData) => {
        const total = record.points.discipline + record.points.hygiene + record.points.academic + record.points.other;
        return <span className="total-points">{total}</span>;
      },
      sorter: (a: StudentData, b: StudentData) => {
        const totalA = a.points.discipline + a.points.hygiene + a.points.academic + a.points.other;
        const totalB = b.points.discipline + b.points.hygiene + b.points.academic + b.points.other;
        return totalA - totalB;
      },
      sortDirections: ['descend', 'ascend'] as SortOrder[],
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: React.ReactNode, record: StudentData) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEditStudent(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<TrophyOutlined />} 
            onClick={() => handlePointsModalOpen(record)}
          >
            积分
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<LineChartOutlined />} 
            onClick={() => handleViewPointLogs(record)}
          >
            记录
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteStudent(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const mainActions = (
    <Space>
      <Button 
        onClick={handleBatchPointsModalOpen} 
        disabled={selectedStudents.length === 0}
        icon={<TrophyOutlined />}
      >
        批量加减分
      </Button>
      <Button
        onClick={handleExportData}
        icon={<ExportOutlined />}
      >
        导出数据
      </Button>
      <Dropdown
        menu={{
          items: [
            {
              key: '1',
              label: '积分项目管理',
              icon: <SettingOutlined />,
              onClick: () => navigate(`/class/${id}/point-items`),
            },
            {
              key: '2',
              label: '奖励兑换管理',
              icon: <GiftOutlined />,
              onClick: () => navigate(`/class/${id}/rewards`),
            },
            {
              key: '3',
              label: '统计报表',
              icon: <LineChartOutlined />,
              onClick: () => navigate(`/class/${id}/statistics`),
            },
            {
              key: '4',
              label: '随机抽取学生',
              icon: <UserAddOutlined />,
              onClick: () => handleRandomPickModalOpen(),
            },
          ],
        }}
      >
        <Button icon={<MoreOutlined />}>更多功能</Button>
      </Dropdown>
    </Space>
  );

  const getTopStudents = () => {
    // 计算总分并排序
    return [...students]
      .map(student => ({
        ...student,
        totalPoints: 
          student.points.discipline + 
          student.points.hygiene + 
          student.points.academic + 
          student.points.other
      }))
      .sort((a, b) => b.totalPoints! - a.totalPoints!)
      .slice(0, 3);
  };

  // 处理批量导入学生弹窗
  const handleImportModalOpen = () => {
    setImportFile(null);
    setPreviewData([]);
    importForm.resetFields();
    setImportModalVisible(true);
  };

  // 导出学生数据
  const exportStudentData = () => {
    if (!students.length) {
      message.warning('没有学生数据可导出');
      return;
    }

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    
    // 准备表头和数据
    const headers = ['学号', '姓名', '分组', '纪律分', '卫生分', '学术分', '其他分', '总分'];
    const data = students.map(student => [
      student.studentId,
      student.name,
      student.group || '',
      student.points.discipline,
      student.points.hygiene,
      student.points.academic,
      student.points.other,
      student.points.discipline + student.points.hygiene + student.points.academic + student.points.other
    ]);
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, `${classInfo?.name || '班级'}_学生名单`);
    
    // 导出为Excel文件
    XLSX.writeFile(workbook, `${classInfo?.name || '班级'}_学生名单.xlsx`);
    
    message.success('导出成功');
  };

  // 处理文件上传改变
  const handleImportFileChange: UploadProps['onChange'] = (info) => {
    const { file } = info;
    if (file.status === 'removed') {
      setImportFile(null);
      setPreviewData([]);
      return;
    }
    
    setImportFile(file);
    
    // 解析Excel文件
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // 预览前10条数据
        setPreviewData(jsonData.slice(0, 10).map((item: any, index: number) => ({
          key: index,
          ...item,
        })));
      } catch (error) {
        message.error('文件解析失败，请确保文件格式正确');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file as any);
  };

  // 处理导入学生提交
  const handleImportSubmit = async () => {
    if (!importFile) {
      message.warning('请先上传文件');
      return;
    }

    try {
      setConfirmLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // 批量添加学生
          let successCount = 0;
          let updatedCount = 0;
          let errorCount = 0;
          
          if (USE_MOCK_DATA) {
            // 模拟数据模式下的处理
            await mockDelay(1000);
            
            // 获取现有的学生数据，创建查找映射
            const existingStudentMap = new Map(students.map(s => [s.studentId, s]));
            
            // 创建新的模拟学生数据
            const newStudents = [...students];
            
            for (const item of jsonData as any[]) {
              try {
                const studentId = Number(item.studentId || item['学号']);
                const name = String(item.name || item['姓名']);
                const group = String(item.group || item['分组'] || '');
                
                // 检查学号是否已存在
                const existingStudent = existingStudentMap.get(studentId);
                
                // 处理积分信息
                let disciplinePoints = Number(item['纪律分'] || item.discipline || 0);
                let hygienePoints = Number(item['卫生分'] || item.hygiene || 0);
                let academicPoints = Number(item['学术分'] || item.academic || 0);
                let otherPoints = Number(item['其他分'] || item.other || 0);
                
                // 如果提供了总积分但没有细分积分，则平均分配
                const totalPointsFromFile = Number(item['总积分'] || item.totalPoints || 0);
                if (totalPointsFromFile > 0 && 
                   (disciplinePoints === 0 && hygienePoints === 0 && 
                    academicPoints === 0 && otherPoints === 0)) {
                  // 平均分配总积分到四个类别
                  const pointsPerCategory = Math.floor(totalPointsFromFile / 4);
                  const remainder = totalPointsFromFile % 4;
                  
                  disciplinePoints = pointsPerCategory + (remainder > 0 ? 1 : 0);
                  hygienePoints = pointsPerCategory + (remainder > 1 ? 1 : 0);
                  academicPoints = pointsPerCategory + (remainder > 2 ? 1 : 0);
                  otherPoints = pointsPerCategory;
                }
                
                if (existingStudent && overrideExisting) {
                  // 更新已存在的学生
                  existingStudent.name = name;
                  existingStudent.group = group;
                  existingStudent.points = {
                    discipline: disciplinePoints,
                    hygiene: hygienePoints,
                    academic: academicPoints,
                    other: otherPoints
                  };
                  
                  // 更新兑换积分
                  existingStudent.exchangeCoins = 
                    disciplinePoints + hygienePoints + academicPoints + otherPoints;
                  
                  updatedCount++;
                } else if (!existingStudent) {
                  // 创建新学生
                  const newStudent: StudentData = {
                    id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
                    studentId: studentId,
                    name: name,
                    group: group,
                    points: {
                      discipline: disciplinePoints,
                      hygiene: hygienePoints,
                      academic: academicPoints,
                      other: otherPoints
                    },
                    exchangeCoins: 0
                  };
                  
                  // 计算兑换积分
                  newStudent.exchangeCoins = 
                    newStudent.points.discipline + 
                    newStudent.points.hygiene + 
                    newStudent.points.academic + 
                    newStudent.points.other;
                  
                  newStudents.push(newStudent);
                  successCount++;
                } else {
                  // 学生存在但不覆盖
                  errorCount++;
                }
              } catch (err) {
                errorCount++;
                console.error(`导入学生失败`, err);
              }
            }
            
            setStudents(newStudents);
            
            // 手动更新全局学生数据并持久化
            try {
              // 获取全局mockStudents数组的引用
              const globalMockStudents = studentAPI.getMockStudents();
              
              // 移除当前班级的学生
              const otherClassStudents = globalMockStudents.filter((s: any) => s.classId !== id);
              
              // 将当前班级的学生转换为MockStudent格式
              const currentClassStudents = newStudents.map((s: any) => ({
                id: s.id,
                studentId: s.studentId,
                name: s.name,
                classId: id!,
                group: s.group,
                points: s.points,
                exchangeCoins: s.exchangeCoins
              }));
              
              // 更新全局数组
              studentAPI.updateMockStudents([...otherClassStudents, ...currentClassStudents]);
              
              // 持久化存储数据
              persistData();
            } catch (err) {
              console.error('Failed to persist imported students:', err);
            }
            
          } else {
            // 真实API调用
            
            // 获取当前班级所有学生
            const existingStudents = await studentAPI.getStudentsByClass(id!);
            const existingStudentMap = new Map(
              existingStudents && Array.isArray(existingStudents) 
                ? existingStudents.map((s: any) => [s.studentId, s])
                : []
            );
            
            // 处理每个学生数据
            for (const item of jsonData as any[]) {
              try {
                const studentId = Number(item.studentId || item['学号']);
                const name = String(item.name || item['姓名']);
                const group = String(item.group || item['分组'] || '');
                
                // 检查学号是否已存在
                const existingStudent = existingStudentMap.get(studentId);
                
                // 处理积分信息
                let disciplinePoints = Number(item['纪律分'] || item.discipline || 0);
                let hygienePoints = Number(item['卫生分'] || item.hygiene || 0);
                let academicPoints = Number(item['学术分'] || item.academic || 0);
                let otherPoints = Number(item['其他分'] || item.other || 0);
                
                // 如果提供了总积分但没有细分积分，则平均分配
                const totalPointsFromFile = Number(item['总积分'] || item.totalPoints || 0);
                if (totalPointsFromFile > 0 && 
                   (disciplinePoints === 0 && hygienePoints === 0 && 
                    academicPoints === 0 && otherPoints === 0)) {
                  // 平均分配总积分到四个类别
                  const pointsPerCategory = Math.floor(totalPointsFromFile / 4);
                  const remainder = totalPointsFromFile % 4;
                  
                  disciplinePoints = pointsPerCategory + (remainder > 0 ? 1 : 0);
                  hygienePoints = pointsPerCategory + (remainder > 1 ? 1 : 0);
                  academicPoints = pointsPerCategory + (remainder > 2 ? 1 : 0);
                  otherPoints = pointsPerCategory;
                }
                
                if (existingStudent && overrideExisting) {
                  // 更新已存在的学生
                  await studentAPI.updateStudent(existingStudent.id, {
                    name,
                    studentId,
                    group,
                    points: {
                      discipline: disciplinePoints,
                      hygiene: hygienePoints,
                      academic: academicPoints,
                      other: otherPoints
                    }
                  } as any); // 使用类型断言暂时解决类型不匹配问题
                  updatedCount++;
                } else if (!existingStudent) {
                  // 创建新学生
                  await studentAPI.createStudent({
                    studentId,
                    name,
                    classId: id!,
                    group,
                    points: {
                      discipline: disciplinePoints,
                      hygiene: hygienePoints,
                      academic: academicPoints,
                      other: otherPoints
                    }
                  });
                  successCount++;
                } else {
                  // 学生存在但不覆盖
                  errorCount++;
                }
              } catch (err) {
                errorCount++;
                console.error(`导入学生失败: ${JSON.stringify(item)}`, err);
              }
            }
          }
          
          if (successCount > 0 || updatedCount > 0) {
            const successMessage = [];
            if (successCount > 0) {
              successMessage.push(`新增 ${successCount} 名学生`);
            }
            if (updatedCount > 0) {
              successMessage.push(`更新 ${updatedCount} 名学生`);
            }
            if (errorCount > 0) {
              successMessage.push(`${errorCount} 名学生处理失败`);
            }
            
            message.success(successMessage.join('，'));
            if (!USE_MOCK_DATA) {
              fetchStudents();
            }
            setImportModalVisible(false);
            setImportFile(null);
          } else if (errorCount > 0 && !overrideExisting) {
            message.warning('导入的学生已存在，请选择"覆盖已有学生"选项进行更新');
          } else {
            message.error('没有学生导入成功，请检查文件格式');
          }
        } catch (error) {
          message.error('文件处理失败');
          console.error(error);
        } finally {
          setConfirmLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(importFile as any);
    } catch (error) {
      setConfirmLoading(false);
      message.error('导入过程中发生错误');
      console.error(error);
    }
  };

  // 下载导入模板
  const downloadTemplate = () => {
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['学号', '姓名', '分组', '总积分', '纪律分', '卫生分', '学术分', '其他分'], // 表头
      [1001, '张三', '第一组', 26, 10, 5, 8, 3],  // 示例数据
      [1002, '李四', '第二组', 27, 8, 6, 9, 4],
    ]);
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生信息');
    
    // 导出为Excel文件
    XLSX.writeFile(workbook, '学生导入模板.xlsx');
  };

  // 添加批量导入和导出按钮
  const renderStudentManagementButtons = () => (
    <Space>
      <Button
        type="default"
        icon={<LineChartOutlined />}
        onClick={() => navigate(`/class/${id}/statistics`)}
      >
        统计报表
      </Button>
      <Dropdown 
        menu={{
          items: [
            {
              key: '1',
              label: '导出所有学生',
              icon: <DownloadOutlined />,
              onClick: exportStudentData,
            },
            {
              key: '2', 
              label: '下载导入模板',
              icon: <DownloadOutlined />,
              onClick: downloadTemplate,
            },
          ],
        }}
      >
        <Button type="default" icon={<ExportOutlined />}>
          导出/下载 <MoreOutlined />
        </Button>
      </Dropdown>
      <Dropdown
        menu={{
          items: [
            {
              key: '1',
              label: '手动添加学生',
              icon: <UserAddOutlined />,
              onClick: handleAddStudent,
            },
            {
              key: '2',
              label: '批量导入学生',
              icon: <ImportOutlined />,
              onClick: handleImportModalOpen,
            },
          ],
        }}
      >
        <Button type="primary" icon={<PlusOutlined />}>
          添加学生 <MoreOutlined />
        </Button>
      </Dropdown>
    </Space>
  );

  // 查看学生积分变动日志
  const handleViewPointLogs = async (student: StudentData) => {
    setCurrentStudentForLogs(student);
    setLogsLoading(true);
    setPointsLogModalVisible(true);
    
    try {
      if (USE_MOCK_DATA) {
        // 模拟积分日志数据
        await mockDelay(1000);
        
        // 创建模拟日志
        const mockLogs: PointLog[] = [];
        
        // 总共生成10条记录
        for (let i = 0; i < 10; i++) {
          const isAdd = Math.random() > 0.3; // 70%是加分记录
          const categories = ['discipline', 'hygiene', 'academic', 'other'] as const;
          const category = categories[Math.floor(Math.random() * categories.length)];
          
          // 根据类别获取积分项目
          const pointItemsForCategory = pointItemOptions[category];
          const pointItem = pointItemsForCategory[Math.floor(Math.random() * pointItemsForCategory.length)];
          
          // 生成记录日期，最近30天内的随机时间
          const recordDate = new Date();
          recordDate.setDate(recordDate.getDate() - Math.floor(Math.random() * 30));
          
          mockLogs.push({
            id: `log_${Date.now()}_${i}`,
            studentId: student.id,
            category,
            pointItem: pointItem.value,
            points: isAdd ? Math.floor(Math.random() * 5) + 1 : -(Math.floor(Math.random() * 3) + 1),
            reason: isAdd 
              ? `${pointItem.label}表现优秀` 
              : `${pointItem.label}需要改进`,
            actionType: isAdd ? 'add' : 'subtract',
            createdAt: recordDate.toISOString(),
            operator: '系统管理员'
          });
        }
        
        // 按时间排序，最近的记录在前面
        mockLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setPointLogs(mockLogs);
      } else {
        // 真实API调用
        const response = await studentAPI.getStudentPointLogs(student.id);
        setPointLogs(response.data);
      }
    } catch (error) {
      message.error('获取积分记录失败');
      console.error(error);
    } finally {
      setLogsLoading(false);
    }
  };

  // 添加积分变动日志记录
  const addPointLog = (student: StudentData, values: any) => {
    const pointItem = actualPointItems[values.category as keyof typeof actualPointItems]
      .find(item => item.value === values.pointItem);
      
    const newLog: PointLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      studentId: student.id,
      category: values.category,
      pointItem: values.pointItem,
      points: values.actionType === 'add' ? values.points : -values.points,
      reason: values.reason,
      actionType: values.actionType,
      createdAt: new Date().toISOString(),
      operator: '当前用户'
    };
    
    setPointLogs(prevLogs => [newLog, ...prevLogs]);
    
    return newLog;
  };

  // 获取积分类别名称的辅助函数
  const getCategoryName = (category: string): string => {
    switch(category) {
      case 'discipline': return '纪律分';
      case 'hygiene': return '卫生分';
      case 'academic': return '学术分';
      case 'other': return '其他分';
      default: return category;
    }
  };

  // 处理分类变更
  const handleCategoryChange = (value: string, form: FormInstance) => {
    // 当分类变更时，清空积分项目选择
    form.setFieldsValue({
      pointItem: undefined,
      points: undefined
    });
    
    if (form === pointsForm) {
      setCategoryForPointsModal(value);
    } else if (form === batchPointsForm) {
      setCategoryForBatchModal(value);
    }
    
    // 强制Select重新渲染
    setForceRender(prev => prev + 1);
  };

  // 打开随机抽取学生模态框
  const handleRandomPickModalOpen = () => {
    setRandomPickCount(1);
    setRandomPickedStudents([]);
    setRandomPickGroupFilter('all');
    setIsPickAnimating(false);
    setRandomPickModalVisible(true);
  };
  
  // 随机抽取学生
  const handleRandomPick = () => {
    if (students.length === 0) {
      message.warning('班级中没有学生可供抽取');
      return;
    }
    
    // 根据分组过滤学生
    const filteredStudents = randomPickGroupFilter === 'all' 
      ? students 
      : students.filter(student => student.group === randomPickGroupFilter);
      
    if (filteredStudents.length === 0) {
      message.warning('所选分组中没有学生可供抽取');
      return;
    }
    
    // 抽取数量不能超过可选学生总数
    const count = Math.min(randomPickCount, filteredStudents.length);
    
    // 开始动画
    setIsPickAnimating(true);
    setFullscreenMode(true);
    
    // 声音效果
    const audio = new Audio('/lottery-sound.mp3');
    audio.volume = 0.5;
    try {
      audio.play().catch(e => console.log('无法播放音效:', e));
    } catch (e) {
      console.log('浏览器不支持自动播放:', e);
    }
    
    // 全屏特效下的滚动名单
    const generateRollingList = () => {
      // 为了滚动效果，生成更多学生数据，但每个只显示简短信息
      const repeatedStudents = [];
      
      // 生成更多更简短的学生条目
      for (let i = 0; i < 300; i++) {  // 进一步增加到300
        // 使用改进的洗牌算法随机打乱学生顺序
        const shuffled = shuffleArray(filteredStudents);
        // 只添加学生ID和姓名，不添加其他信息以减少高度
        repeatedStudents.push(...shuffled.slice(0, count).map(student => ({
          ...student,
          // 可以添加标记，表示这是简化版的条目
          isCompactView: true
        })));
      }
      setRollingStudents(repeatedStudents);
    };
    
    generateRollingList();
    
    // 模拟随机抽取过程
    let animationCounter = 0;
    const animationDuration = 3500; // 缩短到3.5秒
    const animationInterval = 60; // 更短的间隔
    const iterations = animationDuration / animationInterval;
    
    // 滚动动画的速度控制
    const scrollSpeed = {
      initial: 120, // 大幅提高初始滚动速度
      current: 120, // 当前滚动速度也提高
      min: 8,      // 最小滚动速度提高
    };
    
    // 如果存在滚动元素，控制滚动
    if (fullscreenRef.current) {
      fullscreenRef.current.scrollTop = 0;
    }
    
    const scrollAnimation = () => {
      if (fullscreenRef.current) {
        fullscreenRef.current.scrollTop += scrollSpeed.current;
      }
    };
    
    // 启动滚动动画间隔 - 降低间隔以增加流畅度
    const scrollInterval = setInterval(scrollAnimation, 1); // 降低到1ms以获得最大帧率
    
    // 先快速切换，制造紧张感
    const animationTimer = setInterval(() => {
      // 随机选择学生 - 使用改进的洗牌算法
      const randomSelected: StudentData[] = [];
      const shuffled = shuffleArray(filteredStudents);
      
      for (let i = 0; i < count; i++) {
        if (i < shuffled.length) {
          randomSelected.push(shuffled[i]);
        }
      }
      
      setRandomPickedStudents(randomSelected);
      
      animationCounter++;
      
      // 随着动画进行，减缓滚动速度，使用非线性减速以增加刺激感
      if (animationCounter > iterations * 0.6) { // 延迟减速开始时间
        // 使用更缓和的减速曲线，让速度保持更长时间
        const slowdownFactor = Math.pow((iterations - animationCounter) / (iterations * 0.4), 1.2); // 更平缓的曲线
        scrollSpeed.current = Math.max(
          scrollSpeed.min, 
          scrollSpeed.initial * slowdownFactor
        );
        
        // 在减速过程中增加更频繁但幅度更小的晃动效果，使动画更流畅
        if (fullscreenRef.current && animationCounter % 2 === 0) {
          fullscreenRef.current.style.transform = `translateX(${(Math.random() - 0.5) * 4}px)`;
          setTimeout(() => {
            if (fullscreenRef.current) {
              fullscreenRef.current.style.transform = 'translateX(0)';
            }
          }, 30); // 缩短晃动恢复时间
        }
      }
      
      // 动画接近尾声时放慢速度
      if (animationCounter >= iterations * 0.85) { // 延长高速滚动时间
        clearInterval(animationTimer);
        clearInterval(scrollInterval);
        
        // 最后阶段，减速效果并展示最终结果
        setTimeout(() => {
          const finalResult: StudentData[] = [];
          // 使用改进的洗牌算法确保最终结果真正随机
          const finalPool = shuffleArray(filteredStudents);
          
          for (let i = 0; i < count; i++) {
            if (i < finalPool.length) {
              finalResult.push(finalPool[i]);
            }
          }
          
          // 添加短暂的空白暂停，增强戏剧性效果
          if (fullscreenRef.current) {
            fullscreenRef.current.style.opacity = "0.3";
            setTimeout(() => {
              if (fullscreenRef.current) {
                fullscreenRef.current.style.opacity = "1";
                fullscreenRef.current.style.transition = "opacity 0.5s ease";
              }
              setRandomPickedStudents(finalResult);
              setIsPickAnimating(false);
              
              // 添加结果出现时的放大效果
              const resultElements = document.querySelectorAll('.result-student-card');
              resultElements.forEach((el, index) => {
                const element = el as HTMLElement;
                element.style.transform = "scale(0.8)";
                element.style.opacity = "0";
                setTimeout(() => {
                  element.style.transform = "scale(1)";
                  element.style.opacity = "1";
                  element.style.transition = "all 0.5s ease";
                }, index * 100);
              });
              
              // 结束后延迟关闭全屏
              setTimeout(() => {
                setFullscreenMode(false);
              }, 3000);
              
              // 展示成功消息
              message.success({
                content: `成功抽取了 ${finalResult.length} 名学生！`,
                className: 'lottery-success-message',
              });
            }, 300);
          } else {
            setRandomPickedStudents(finalResult);
            setIsPickAnimating(false);
            
            // 结束后延迟关闭全屏
            setTimeout(() => {
              setFullscreenMode(false);
            }, 3000);
            
            // 展示成功消息
            message.success({
              content: `成功抽取了 ${finalResult.length} 名学生！`,
              className: 'lottery-success-message',
            });
          }
        }, 500); // 降低最终结果显示前的延迟
      }
    }, animationInterval);
  };
  
  // 获取所有小组
  const getAllGroups = () => {
    const groups = new Set<string>();
    students.forEach(student => {
      if (student.group) {
        groups.add(student.group);
      }
    });
    return Array.from(groups);
  };

  // 获取积分项目
  const fetchPointItems = async () => {
    try {
      if (USE_MOCK_DATA) {
        // 模拟数据模式下，使用模拟数据
        await mockDelay(1000);
        
        // 模拟从积分项目管理中获取的数据
        // 这里根据您的描述替换为实际的积分项目
        const mockPointItems = {
          discipline: [
            { value: 'discipline_classroom', label: '课堂表现优秀' },
            { value: 'discipline_talking', label: '上课说话' }
          ],
          hygiene: [
            { value: 'hygiene_cleaning', label: '打扫卫生认真负责' }
          ],
          academic: [
            { value: 'academic_excellent', label: '考试成绩优异' }
          ],
          other: [
            { value: 'other_helping', label: '帮助同学' }
          ]
        };
        
        setActualPointItems(mockPointItems);
      } else {
        // 实际API调用
        // const response = await axios.get(`/api/classes/${id}/point-items`);
        // 根据实际API返回的数据结构处理
        // setActualPointItems(formatPointItems(response.data));
      }
    } catch (error) {
      console.error('获取积分项目失败', error);
      message.error('获取积分项目失败');
    }
  };

  if (!classInfo) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="class-detail-container">
      <div className="class-header">
        <div>
          <Title level={2} className="class-title">
            {classInfo.name}
          </Title>
          {classInfo.description && (
            <Text className="class-description">{classInfo.description}</Text>
          )}
        </div>
        {renderStudentManagementButtons()}
      </div>

      <Card className="students-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部学生" key="all">
            <div className="action-bar">
              <Space>
                <Button 
                  type="primary" 
                  disabled={selectedStudents.length === 0}
                  onClick={handleBatchPointsModalOpen}
                >
                  批量积分
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchStudents}
                >
                  刷新
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => navigate(`/class/${id}/point-items`)}
                >
                  积分项目管理
                </Button>
                <Button
                  icon={<GiftOutlined />}
                  onClick={() => navigate(`/class/${id}/rewards`)}
                >
                  奖励兑换管理
                </Button>
                <Button
                  icon={<LineChartOutlined />}
                  onClick={() => navigate(`/class/${id}/statistics`)}
                >
                  统计报表
                </Button>
                <Button
                  icon={<UserAddOutlined />}
                  onClick={() => handleRandomPickModalOpen()}
                >
                  随机抽取学生
                </Button>
              </Space>
            </div>
            <Table
              rowKey="id"
              dataSource={students}
              columns={columns}
              loading={loading}
              className="students-table"
              rowSelection={{
                selectedRowKeys: selectedStudents,
                onChange: (selectedRowKeys) => {
                  setSelectedStudents(selectedRowKeys as string[]);
                }
              }}
              pagination={false}
            />
          </TabPane>
          <TabPane tab="积分排行榜" key="ranking">
            <Table
              rowKey="id"
              dataSource={students}
              columns={columns.filter(col => col.key !== 'action')}
              loading={loading}
              className="students-table ranking-table"
              pagination={false}
              onChange={(pagination, filters, sorter: any) => {
                if (sorter.field && sorter.field.includes('totalPoints')) {
                  setSortOrder(sorter.order);
                }
              }}
              rowClassName={(record, index) => {
                const allStudents = [...students].sort((a, b) => {
                  const totalA = a.points.discipline + a.points.hygiene + a.points.academic + a.points.other;
                  const totalB = b.points.discipline + b.points.hygiene + b.points.academic + b.points.other;
                  return totalB - totalA;
                });
                
                const position = allStudents.findIndex(s => s.id === record.id);
                
                if (position === 0) return 'first-place';
                if (position === 1) return 'second-place';
                if (position === 2) return 'third-place';
                return '';
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 学生表单模态框 */}
      <Modal
        title={editingStudent ? '编辑学生' : '添加学生'}
        open={studentModalVisible}
        onCancel={() => setStudentModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={studentForm}
          layout="vertical"
          onFinish={handleStudentFormSubmit}
        >
          <Form.Item
            name="studentId"
            label="学号"
            rules={[
              { required: true, message: '请输入学号' },
              { type: 'number', message: '学号必须是数字' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入学号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="group"
            label="分组"
          >
            <Input placeholder="请输入分组名称（可选）" />
          </Form.Item>
          <Form.Item className="form-buttons">
            <Button onClick={() => setStudentModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 积分表单模态框 */}
      <Modal
        title="积分更新"
        open={pointsModalVisible}
        onCancel={() => setPointsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={pointsForm}
          layout="vertical"
          onFinish={handlePointsFormSubmit}
          initialValues={{ actionType: 'add' }}
        >
          <Form.Item
            name="category"
            label="积分类别"
            rules={[{ required: true, message: '请选择积分类别' }]}
          >
            <Select 
              placeholder="请选择积分类别"
              onChange={(value) => handleCategoryChange(value as string, pointsForm)}
            >
              <Option value="discipline">纪律分</Option>
              <Option value="hygiene">卫生分</Option>
              <Option value="academic">学术分</Option>
              <Option value="other">其他分</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="pointItem"
            label="积分项目"
            dependencies={['category']}
            rules={[{ required: true, message: '请选择积分项目' }]}
          >
            <Select 
              key={`point-select-${pointsForm.getFieldValue('category') || ''}-${forceRender}`}
              placeholder="请选择积分项目"
              disabled={!pointsForm.getFieldValue('category')}
              onChange={(value) => {
                // 根据积分项目设置积分值
                const category = pointsForm.getFieldValue('category');
                const itemSelected = category ? 
                  actualPointItems[category as keyof typeof actualPointItems]?.find(item => item.value === value) : null;
                
                if (itemSelected) {
                  // 获取积分项目的预设积分值
                  const defaultPointsMap = {
                    'discipline_classroom': 5,
                    'discipline_talking': -3,
                    'hygiene_cleaning': 5,
                    'academic_excellent': 10,
                    'other_helping': 5
                  };
                  
                  // 获取项目对应的积分值，如果未定义则使用默认值5
                  const pointValue = defaultPointsMap[value as keyof typeof defaultPointsMap] || 5;
                  
                  // 设置表单值
                  pointsForm.setFieldsValue({ points: pointValue });
                }
              }}
            >
              {(() => {
                const category = pointsForm.getFieldValue('category');
                if (!category) return null;
                
                // 使用实际积分项目
                return actualPointItems[category as keyof typeof actualPointItems]?.map(item => (
                  <Option key={item.value} value={item.value}>{item.label}</Option>
                ));
              })()}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="actionType"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Radio.Group>
              <Radio value="add">加分</Radio>
              <Radio value="subtract">减分</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="points"
            label="积分值"
            rules={[{ required: true, message: '请输入积分值' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="reason"
            label="原因说明"
            required={false}
          >
            <Input.TextArea rows={3} placeholder="请输入积分调整原因（选填）" />
          </Form.Item>
          
          <Form.Item className="form-buttons">
            <Button onClick={() => setPointsModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量积分表单模态框 */}
      <Modal
        title="批量更新积分"
        open={batchPointsModalVisible}
        onCancel={() => setBatchPointsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={batchPointsForm}
          layout="vertical"
          onFinish={handleBatchPointsFormSubmit}
          initialValues={{ actionType: 'add' }}
        >
          <div className="batch-info">
            <Text strong>已选择 {selectedStudents.length} 名学生</Text>
          </div>
          <Form.Item
            name="category"
            label="积分类别"
            rules={[{ required: true, message: '请选择积分类别' }]}
          >
            <Select 
              placeholder="选择积分类别"
              onChange={(value) => handleCategoryChange(value as string, batchPointsForm)}
            >
              <Option value="discipline">纪律分</Option>
              <Option value="hygiene">卫生分</Option>
              <Option value="academic">学习分</Option>
              <Option value="other">其他分数</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="pointItem"
            label="积分项目"
            dependencies={['category']}
            rules={[{ required: true, message: '请选择积分项目' }]}
          >
            <Select 
              key={`batch-point-select-${batchPointsForm.getFieldValue('category') || ''}-${forceRender}`}
              placeholder="请选择积分项目"
              disabled={!batchPointsForm.getFieldValue('category')}
              onChange={(value) => {
                // 根据积分项目设置积分值
                const category = batchPointsForm.getFieldValue('category');
                const itemSelected = category ? 
                  actualPointItems[category as keyof typeof actualPointItems]?.find(item => item.value === value) : null;
                
                if (itemSelected) {
                  // 获取积分项目的预设积分值
                  const defaultPointsMap = {
                    'discipline_classroom': 5,
                    'discipline_talking': -3,
                    'hygiene_cleaning': 5,
                    'academic_excellent': 10,
                    'other_helping': 5
                  };
                  
                  // 获取项目对应的积分值，如果未定义则使用默认值5
                  const pointValue = defaultPointsMap[value as keyof typeof defaultPointsMap] || 5;
                  
                  // 设置表单值
                  batchPointsForm.setFieldsValue({ points: pointValue });
                }
              }}
            >
              {(() => {
                const category = batchPointsForm.getFieldValue('category');
                if (!category) return null;
                
                // 使用实际积分项目
                return actualPointItems[category as keyof typeof actualPointItems]?.map(item => (
                  <Option key={item.value} value={item.value}>{item.label}</Option>
                ));
              })()}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="actionType"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Radio.Group>
              <Radio value="add">加分</Radio>
              <Radio value="subtract">减分</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="points"
            label="分数"
            rules={[
              { required: true, message: '请输入分数' },
              { type: 'number', min: 1, message: '分数必须大于0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入分数" min={1} max={100} />
          </Form.Item>
          
          <Form.Item
            name="reason"
            label="原因说明"
            required={false}
          >
            <Input.TextArea rows={3} placeholder="请输入加/减分原因（选填）" />
          </Form.Item>
          
          <Form.Item className="form-buttons">
            <Button onClick={() => setBatchPointsModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入学生模态框 */}
      <Modal
        title="批量导入学生"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div className="import-container">
          <Dragger
            beforeUpload={(file) => {
              // 限制文件格式
              const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                              file.type === 'application/vnd.ms-excel';
              if (!isExcel) {
                message.error('只能上传Excel文件');
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            onChange={handleImportFileChange}
            fileList={importFile ? [importFile] : []}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽Excel文件到此区域</p>
            <p className="ant-upload-hint">
              支持 .xlsx, .xls 格式，请确保文件格式正确
            </p>
          </Dragger>
          
          {/* 添加覆盖选项 */}
          <div style={{ marginTop: 16 }}>
            <Checkbox 
              checked={overrideExisting} 
              onChange={(e) => setOverrideExisting(e.target.checked)}
            >
              覆盖已有学生数据（如果学号已存在）
            </Checkbox>
          </div>
          
          {previewData.length > 0 && (
            <div className="preview-container">
              <Divider>预览（仅显示前10条）</Divider>
              <Table
                columns={[
                  { title: '学号', dataIndex: 'studentId', key: 'studentId' },
                  { title: '姓名', dataIndex: 'name', key: 'name' },
                  { title: '分组', dataIndex: 'group', key: 'group' },
                  { title: '总积分', dataIndex: 'totalPoints', key: 'totalPoints' },
                  { title: '纪律分', dataIndex: 'discipline', key: 'discipline' },
                  { title: '卫生分', dataIndex: 'hygiene', key: 'hygiene' },
                  { title: '学术分', dataIndex: 'academic', key: 'academic' },
                  { title: '其他分', dataIndex: 'other', key: 'other' },
                ]}
                dataSource={previewData}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
          
          <div className="action-buttons">
            <Space>
              <Button onClick={downloadTemplate}>
                下载模板
              </Button>
              <Button 
                type="primary" 
                onClick={handleImportSubmit} 
                loading={confirmLoading}
                disabled={!importFile}
              >
                导入
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* 积分变动日志模态框 */}
      <Modal
        title={`${currentStudentForLogs?.name || '学生'} - 积分变动记录`}
        open={pointsLogModalVisible}
        onCancel={() => setPointsLogModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={pointLogs}
          rowKey="id"
          loading={logsLoading}
          pagination={false}
          columns={[
            {
              title: '时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (text) => new Date(text).toLocaleString(),
            },
            {
              title: '类别',
              dataIndex: 'category',
              key: 'category',
              render: (text) => getCategoryName(text),
            },
            {
              title: '项目',
              dataIndex: 'pointItem',
              key: 'pointItem',
              render: (text: string, record: PointLog) => getPointItemName(record.category, text, pointItemOptions)
            },
            {
              title: '积分变动',
              dataIndex: 'points',
              key: 'points',
              render: (points) => (
                <span style={{ color: points > 0 ? 'green' : 'red' }}>
                  {points > 0 ? `+${points}` : points}
                </span>
              ),
            },
            {
              title: '原因',
              dataIndex: 'reason',
              key: 'reason',
            },
            {
              title: '操作人',
              dataIndex: 'operator',
              key: 'operator',
            },
          ]}
        />
      </Modal>

      {/* 随机抽取学生模态框 */}
      <Modal
        title="随机抽取学生"
        open={randomPickModalVisible}
        onCancel={() => setRandomPickModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRandomPickModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="pick" 
            type="primary" 
            onClick={handleRandomPick}
            loading={isPickAnimating}
            size="large"
          >
            {isPickAnimating ? "抽取中..." : "开始抽取"}
          </Button>
        ]}
        destroyOnClose
        width={900}
        centered
        className="random-pick-modal"
      >
        <div className="random-pick-container">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div className="form-item">
                <label>抽取数量：</label>
                <InputNumber 
                  min={1} 
                  max={students.length} 
                  value={randomPickCount}
                  onChange={val => setRandomPickCount(val as number)}
                  disabled={isPickAnimating}
                  size="large"
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="form-item">
                <label>按分组筛选：</label>
                <Select 
                  style={{ width: '100%' }}
                  value={randomPickGroupFilter}
                  onChange={val => setRandomPickGroupFilter(val)}
                  disabled={isPickAnimating}
                  size="large"
                >
                  <Option value="all">全部</Option>
                  {getAllGroups().map(group => (
                    <Option key={group} value={group}>{group}</Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
          
          <Divider orientation="left">抽取结果</Divider>
          
          <div className={`lottery-container ${isPickAnimating ? 'active' : ''}`}>
            {randomPickedStudents.length > 0 ? (
              <Table
                dataSource={randomPickedStudents}
                rowKey="id"
                pagination={false}
                rowClassName={() => isPickAnimating ? 'highlight-row' : 'result-row'}
                className="lottery-result-table"
                columns={[
                  {
                    title: '学号',
                    dataIndex: 'studentId',
                    key: 'studentId',
                  },
                  {
                    title: '姓名',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name) => <span className="student-name">{name}</span>
                  },
                  {
                    title: '分组',
                    dataIndex: 'group',
                    key: 'group',
                    render: text => text || '未分组'
                  },
                  {
                    title: '总积分',
                    key: 'totalPoints',
                    render: (_, record) => {
                      const totalPoints = record.points.discipline + 
                        record.points.hygiene + 
                        record.points.academic + 
                        record.points.other;
                      return <span className="total-points">{totalPoints}</span>;
                    }
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => handlePointsModalOpen(record)}
                        disabled={isPickAnimating}
                      >
                        积分管理
                      </Button>
                    )
                  }
                ]}
              />
            ) : (
              <Empty 
                description={
                  <span className="empty-text">点击「开始抽取」按钮随机抽取学生</span>
                } 
                className="lottery-empty"
              />
            )}
            
            {isPickAnimating && (
              <div className="lottery-animation">
                <div className="lottery-light"></div>
                <div className="lottery-message">随机抽取中...</div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 全屏抽奖动画 */}
      {fullscreenMode && (
        <div className="lottery-fullscreen-overlay">
          <div className="lottery-fullscreen-content">
            <div className="lottery-header">
              <TrophyFilled className="lottery-trophy-icon" />
              <h1>随机抽取学生</h1>
              <Button 
                type="text" 
                className="close-fullscreen-btn"
                icon={<FullscreenOutlined />} 
                onClick={() => setFullscreenMode(false)}
              />
            </div>
            
            {isPickAnimating ? (
              <>
                <div className="lottery-rolling-container" ref={fullscreenRef}>
                  <div className="rolling-start-spacer"></div>
                  {rollingStudents.map((student, index) => (
                    <div key={`rolling-${index}`} className="rolling-student-item">
                      <span className="rolling-student-id">{student.studentId}</span>
                      <span className="rolling-student-name">{student.name}</span>
                      {/* 仅在非简化视图下显示分组 */}
                      {student.group && !student.isCompactView && (
                        <span className="rolling-student-group">{student.group}</span>
                      )}
                    </div>
                  ))}
                  <div className="rolling-end-spacer"></div>
                </div>
                
                <div className="lottery-spotlight">
                  <div className="spotlight-line"></div>
                </div>
                
                <div className="lottery-status">正在抽取中...</div>
              </>
            ) : (
              <div className="lottery-result-fullscreen">
                <h2>抽取结果</h2>
                <div className="lottery-result-cards">
                  {randomPickedStudents.map((student) => (
                    <div key={student.id} className="result-student-card">
                      <div className="result-student-avatar">{student.name.charAt(0)}</div>
                      <div className="result-student-info">
                        <div className="result-student-name">{student.name}</div>
                        <div className="result-student-id">学号: {student.studentId}</div>
                        <div className="result-student-group">{student.group || '未分组'}</div>
                      </div>
                      <div className="result-student-points">
                        <span>{student.points.discipline + student.points.hygiene + student.points.academic + student.points.other}</span>
                        <small>积分</small>
                      </div>
                      <Button 
                        type="primary" 
                        className="result-student-points-btn"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setFullscreenMode(false);
                          setTimeout(() => handlePointsModalOpen(student), 100);
                        }}
                      >
                        积分管理
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="result-confetti"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail; 