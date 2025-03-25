import React, { useState, useEffect } from 'react';
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
  Row,
  Col,
  Tag,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './PointItems.css';

const { Title, Text } = Typography;
const { Option } = Select;

// 积分项目接口定义
interface PointItem {
  _id: string;
  name: string;
  description?: string;
  points: number;
  category: 'discipline' | 'hygiene' | 'academic' | 'other';
  actionType: 'add' | 'subtract';
  classId: string;
}

const PointItems: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [pointItems, setPointItems] = useState<PointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PointItem | null>(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [className, setClassName] = useState('');

  // 获取班级信息
  useEffect(() => {
    const fetchClassName = async () => {
      try {
        const response = await axios.get(`/api/classes/${id}`);
        setClassName(response.data.name);
      } catch (error) {
        console.error('获取班级信息失败', error);
      }
    };

    fetchClassName();
  }, [id]);

  // 获取积分项目列表
  useEffect(() => {
    const fetchPointItems = async () => {
      try {
        setLoading(true);
        // 实际开发中需要替换为真实API调用
        // const response = await axios.get(`/api/classes/${id}/point-items`);
        // setPointItems(response.data);
        
        // 模拟数据
        setTimeout(() => {
          const mockData: PointItem[] = [
            {
              _id: '1',
              name: '课堂表现优秀',
              description: '上课专心听讲，积极回答问题',
              points: 5,
              category: 'discipline',
              actionType: 'add',
              classId: id || '',
            },
            {
              _id: '2',
              name: '打扫卫生认真负责',
              description: '值日工作完成出色',
              points: 3,
              category: 'hygiene',
              actionType: 'add',
              classId: id || '',
            },
            {
              _id: '3',
              name: '考试成绩优异',
              description: '考试得分超过90分',
              points: 10,
              category: 'academic',
              actionType: 'add',
              classId: id || '',
            },
            {
              _id: '4',
              name: '上课说话',
              description: '课堂上与同学闲聊',
              points: 2,
              category: 'discipline',
              actionType: 'subtract',
              classId: id || '',
            },
            {
              _id: '5',
              name: '帮助同学',
              description: '主动帮助有困难的同学',
              points: 5,
              category: 'other',
              actionType: 'add',
              classId: id || '',
            },
          ];
          setPointItems(mockData);
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        message.error('获取积分项目失败');
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchPointItems();
  }, [id]);

  // 处理添加按钮点击
  const handleAddItem = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑按钮点击
  const handleEditItem = (item: PointItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      points: item.points,
      category: item.category,
      actionType: item.actionType,
    });
    setModalVisible(true);
  };

  // 处理删除按钮点击
  const handleDeleteItem = (itemId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个积分项目吗？',
      onOk: async () => {
        try {
          // 实际开发中需要替换为真实API调用
          // await axios.delete(`/api/point-items/${itemId}`);
          
          // 模拟成功响应
          setTimeout(() => {
            setPointItems(pointItems.filter(item => item._id !== itemId));
            message.success('积分项目已删除');
          }, 500);
        } catch (error) {
          message.error('删除失败');
          console.error(error);
        }
      },
    });
  };

  // 处理表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      // 实际开发中需要替换为真实API调用
      if (editingItem) {
        // 编辑现有项目
        // await axios.put(`/api/point-items/${editingItem._id}`, values);
        
        // 模拟成功响应
        setTimeout(() => {
          const updatedItems = pointItems.map(item => 
            item._id === editingItem._id ? { ...item, ...values } : item
          );
          setPointItems(updatedItems);
          setModalVisible(false);
          message.success('积分项目已更新');
          setConfirmLoading(false);
        }, 500);
      } else {
        // 添加新项目
        // const response = await axios.post(`/api/classes/${id}/point-items`, {
        //   ...values,
        //   classId: id,
        // });
        
        // 模拟成功响应
        setTimeout(() => {
          const newItem: PointItem = {
            _id: Date.now().toString(),
            ...values,
            classId: id || '',
          };
          setPointItems([...pointItems, newItem]);
          setModalVisible(false);
          message.success('积分项目已添加');
          setConfirmLoading(false);
        }, 500);
      }
    } catch (error) {
      message.error('操作失败');
      console.error(error);
      setConfirmLoading(false);
    }
  };

  // 处理返回按钮点击
  const handleGoBack = () => {
    navigate(`/class/${id}`);
  };

  // 获取类别颜色
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

  // 获取类别名称
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

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      title: '积分值',
      key: 'points',
      render: (text: any, record: PointItem) => (
        <span style={{ color: record.actionType === 'add' ? '#52c41a' : '#f5222d' }}>
          {record.actionType === 'add' ? '+' : '-'}{record.points}
        </span>
      ),
      sorter: (a: PointItem, b: PointItem) => {
        const aValue = a.actionType === 'add' ? a.points : -a.points;
        const bValue = b.actionType === 'add' ? b.points : -b.points;
        return aValue - bValue;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: PointItem) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditItem(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteItem(record._id)}
            />
          </Tooltip>
          <Tooltip title="应用到学生">
            <Button 
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => message.info('应用积分功能开发中...')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 按类别分组展示积分项目
  const renderPointItemsByCategory = () => {
    const categories = ['discipline', 'hygiene', 'academic', 'other'];
    
    return categories.map(category => {
      const items = pointItems.filter(item => item.category === category);
      
      if (items.length === 0) return null;
      
      return (
        <Card 
          key={category}
          title={
            <div className="category-header">
              <div 
                className="category-dot" 
                style={{ backgroundColor: getCategoryColor(category) }}
              ></div>
              <span>{getCategoryName(category)}</span>
              <span className="category-count">({items.length})</span>
            </div>
          }
          className="category-card"
        >
          <Table
            columns={columns}
            dataSource={items}
            rowKey="_id"
            pagination={false}
            size="middle"
          />
        </Card>
      );
    });
  };

  return (
    <div className="point-items-container">
      <div className="page-header">
        <div>
          <Title level={2} className="page-title">
            积分项目管理
          </Title>
          <Text className="class-name">
            {className || '加载中...'}
          </Text>
        </div>
        <Space>
          <Button 
            icon={<RollbackOutlined />} 
            onClick={handleGoBack}
          >
            返回班级
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddItem}
          >
            添加积分项目
          </Button>
        </Space>
      </div>

      <div className="point-items-content">
        {loading ? (
          <div className="loading-container">加载中...</div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                {renderPointItemsByCategory()}
              </Col>
            </Row>
          </>
        )}
      </div>

      {/* 表单模态框 */}
      <Modal
        title={editingItem ? '编辑积分项目' : '添加积分项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入积分项目名称' }]}
          >
            <Input placeholder="积分项目名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="积分项目描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="选择类别">
              <Option value="discipline">纪律</Option>
              <Option value="hygiene">卫生</Option>
              <Option value="academic">学习</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="actionType"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Select placeholder="选择操作类型">
              <Option value="add">加分</Option>
              <Option value="subtract">减分</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="points"
            label="积分值"
            rules={[
              { required: true, message: '请输入积分值' },
              { type: 'number', min: 1, message: '积分值需大于0' },
            ]}
          >
            <InputNumber placeholder="输入积分值" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item className="form-buttons">
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PointItems; 