import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Card,
  Row,
  Col,
  Tooltip,
  Avatar,
  Badge,
  Statistic,
  Empty,
  Tag,
  Divider,
  Select,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  GiftOutlined,
  HistoryOutlined,
  LoadingOutlined,
  PictureOutlined,
  UploadOutlined,
  TableOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './Rewards.css';
import { studentAPI } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 预设的奖励图片列表
const REWARD_IMAGES = [
  'https://cdn-icons-png.flaticon.com/512/5726/5726532.png', // 简单几何图形
  'https://cdn-icons-png.flaticon.com/512/5726/5726765.png', // 抽象线条
  'https://cdn-icons-png.flaticon.com/512/6616/6616350.png', // 简笔波浪线
  'https://cdn-icons-png.flaticon.com/512/6729/6729050.png', // 抽象圆形
  'https://cdn-icons-png.flaticon.com/512/6729/6729167.png', // 简单图案
  'https://cdn-icons-png.flaticon.com/512/5726/5726695.png', // 线条图形
  'https://cdn-icons-png.flaticon.com/512/6729/6729048.png', // 抽象形状
  'https://cdn-icons-png.flaticon.com/512/6729/6729116.png', // 几何线条
  'https://cdn-icons-png.flaticon.com/512/6731/6731452.png', // 简单图标
  'https://cdn-icons-png.flaticon.com/512/6729/6729059.png', // 简笔图形
];

// 获取随机图片URL
const getRandomImageUrl = () => {
  const randomIndex = Math.floor(Math.random() * REWARD_IMAGES.length);
  return REWARD_IMAGES[randomIndex];
};

// 奖励项目接口定义
interface Reward {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  coins: number;
  stock: number;
  exchangeCount: number;
  classId: string;
}

// 兑换记录接口定义
interface Exchange {
  _id: string;
  student: {
    _id: string;
    name: string;
    studentId: number;
  };
  reward: {
    _id: string;
    name: string;
  };
  coins: number;
  date: string;
}

// 添加学生接口定义
interface Student {
  _id: string;
  studentId: number;
  name: string;
  exchangeCoins: number;
  classId: string;
}

const Rewards: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangesLoading, setExchangesLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [form] = Form.useForm();
  const [exchangeForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [className, setClassName] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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

  // 获取奖励项目列表
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        // 实际开发中需要替换为真实API调用
        // const response = await axios.get(`/api/classes/${id}/rewards`);
        // setRewards(response.data);
        
        // 模拟数据
        setTimeout(() => {
          const mockData: Reward[] = [
            {
              _id: '1',
              name: '铅笔',
              description: '高品质HB铅笔',
              imageUrl: getRandomImageUrl(),
              coins: 5,
              stock: 20,
              exchangeCount: 10,
              classId: id || '',
            },
            {
              _id: '2',
              name: '橡皮擦',
              description: '优质橡皮擦，不易留痕',
              imageUrl: getRandomImageUrl(),
              coins: 3,
              stock: 15,
              exchangeCount: 5,
              classId: id || '',
            },
            {
              _id: '3',
              name: '贴纸',
              description: '可爱动物贴纸一套',
              imageUrl: getRandomImageUrl(),
              coins: 10,
              stock: 10,
              exchangeCount: 3,
              classId: id || '',
            },
            {
              _id: '4',
              name: '课外阅读书',
              description: '精选儿童文学读物',
              imageUrl: getRandomImageUrl(),
              coins: 30,
              stock: 5,
              exchangeCount: 1,
              classId: id || '',
            },
            {
              _id: '5',
              name: '课间休息券',
              description: '可以获得额外5分钟的课间休息时间',
              imageUrl: getRandomImageUrl(),
              coins: 15,
              stock: 8,
              exchangeCount: 2,
              classId: id || '',
            },
          ];
          setRewards(mockData);
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        message.error('获取奖励项目失败');
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchRewards();
  }, [id]);

  // 获取兑换记录
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        setExchangesLoading(true);
        // 实际开发中需要替换为真实API调用
        // const response = await axios.get(`/api/classes/${id}/exchanges`);
        // setExchanges(response.data);
        
        // 模拟数据
        setTimeout(() => {
          const mockData: Exchange[] = [
            {
              _id: '1',
              student: {
                _id: 's1',
                name: '张三',
                studentId: 1,
              },
              reward: {
                _id: '1',
                name: '铅笔',
              },
              coins: 5,
              date: '2023-06-01T10:30:00Z',
            },
            {
              _id: '2',
              student: {
                _id: 's2',
                name: '李四',
                studentId: 2,
              },
              reward: {
                _id: '2',
                name: '橡皮擦',
              },
              coins: 3,
              date: '2023-06-02T14:15:00Z',
            },
            {
              _id: '3',
              student: {
                _id: 's3',
                name: '王五',
                studentId: 3,
              },
              reward: {
                _id: '3',
                name: '贴纸',
              },
              coins: 10,
              date: '2023-06-03T09:45:00Z',
            },
          ];
          setExchanges(mockData);
          setExchangesLoading(false);
        }, 1000);
        
      } catch (error) {
        message.error('获取兑换记录失败');
        console.error(error);
        setExchangesLoading(false);
      }
    };
    
    fetchExchanges();
  }, [id]);

  // 获取班级学生列表
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        // 使用 studentAPI 获取当前班级的真实学生数据
        const response = await studentAPI.getStudentsByClass(id!);
        setStudents(response.data.map((student: any) => ({
          _id: student.id,
          studentId: student.studentId,
          name: student.name,
          exchangeCoins: student.exchangeCoins || 0,
          classId: student.classId
        })));
        setStudentsLoading(false);
      } catch (error) {
        message.error('获取学生列表失败');
        console.error(error);
        setStudentsLoading(false);
      }
    };
    
    fetchStudents();
  }, [id]);

  // 处理添加按钮点击
  const handleAddReward = () => {
    setEditingReward(null);
    setImageUrl('');
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑按钮点击
  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setImageUrl(reward.imageUrl || '');
    form.setFieldsValue({
      name: reward.name,
      description: reward.description,
      coins: reward.coins,
      stock: reward.stock,
    });
    setModalVisible(true);
  };

  // 处理删除按钮点击
  const handleDeleteReward = (rewardId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个奖励项目吗？',
      onOk: async () => {
        try {
          // 实际开发中需要替换为真实API调用
          // await axios.delete(`/api/rewards/${rewardId}`);
          
          // 模拟成功响应
          setTimeout(() => {
            setRewards(rewards.filter(reward => reward._id !== rewardId));
            message.success('奖励项目已删除');
          }, 500);
        } catch (error) {
          message.error('删除失败');
          console.error(error);
        }
      },
    });
  };

  // 处理兑换按钮点击
  const handleExchangeReward = (reward: Reward) => {
    setCurrentReward(reward);
    setSelectedStudent('');
    exchangeForm.resetFields();
    setExchangeModalVisible(true);
  };

  // 处理兑换表单提交
  const handleExchangeFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      const student = students.find((s: Student) => s._id === values.studentId);
      
      if (!student) {
        message.error('找不到选中的学生');
        setConfirmLoading(false);
        return;
      }
      
      if (student.exchangeCoins < currentReward!.coins) {
        message.error('学生兑换币不足');
        setConfirmLoading(false);
        return;
      }
      
      if (currentReward!.stock <= 0) {
        message.error('奖励库存不足');
        setConfirmLoading(false);
        return;
      }
      
      // 实际开发中需要替换为真实API调用
      // await axios.post(`/api/students/${values.studentId}/exchanges`, {
      //   rewardId: currentReward!._id,
      //   coins: currentReward!.coins,
      // });
      
      // 模拟成功响应
      setTimeout(() => {
        // 更新学生兑换币
        const updatedStudents = students.map(s => 
          s._id === values.studentId 
            ? { ...s, exchangeCoins: s.exchangeCoins - currentReward!.coins } 
            : s
        );
        setStudents(updatedStudents);
        
        // 更新奖励库存和兑换次数
        const updatedRewards = rewards.map(r => 
          r._id === currentReward!._id 
            ? { 
                ...r, 
                stock: r.stock - 1,
                exchangeCount: r.exchangeCount + 1
              } 
            : r
        );
        setRewards(updatedRewards);
        
        // 添加新的兑换记录
        const newExchange: Exchange = {
          _id: Date.now().toString(),
          student: {
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
          },
          reward: {
            _id: currentReward!._id,
            name: currentReward!.name,
          },
          coins: currentReward!.coins,
          date: new Date().toISOString(),
        };
        setExchanges([newExchange, ...exchanges]);
        
        setExchangeModalVisible(false);
        message.success('兑换成功');
        setConfirmLoading(false);
        
        // 如果在历史记录页面，切换到历史记录tab
        if (activeTab === 'history') {
          // 刷新数据
        } else {
          // 切换到历史记录tab
          setActiveTab('history');
        }
      }, 500);
    } catch (error) {
      message.error('兑换失败');
      console.error(error);
      setConfirmLoading(false);
    }
  };

  // 处理图片上传
  const handleImageUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setImageLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 实际开发中处理上传成功后获取图片URL
      // setImageUrl(info.file.response.url);
      
      // 模拟上传成功
      setTimeout(() => {
        setImageUrl('https://via.placeholder.com/150');
        setImageLoading(false);
      }, 500);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      
      // 添加图片URL到表单数据
      const rewardData = {
        ...values,
        imageUrl: imageUrl || getRandomImageUrl(), // 如果没有上传图片，随机分配一个
      };
      
      // 实际开发中需要替换为真实API调用
      if (editingReward) {
        // 编辑现有项目
        // await axios.put(`/api/rewards/${editingReward._id}`, rewardData);
        
        // 模拟成功响应
        setTimeout(() => {
          const updatedRewards = rewards.map(reward => 
            reward._id === editingReward._id 
              ? { 
                  ...reward, 
                  ...rewardData,
                  imageUrl: imageUrl || reward.imageUrl || getRandomImageUrl(),
                } 
              : reward
          );
          setRewards(updatedRewards);
          setModalVisible(false);
          message.success('奖励项目已更新');
          setConfirmLoading(false);
        }, 500);
      } else {
        // 添加新项目
        // const response = await axios.post(`/api/classes/${id}/rewards`, {
        //   ...rewardData,
        //   classId: id,
        // });
        
        // 模拟成功响应
        setTimeout(() => {
          const newReward: Reward = {
            _id: Date.now().toString(),
            ...rewardData,
            exchangeCount: 0,
            classId: id || '',
          };
          setRewards([...rewards, newReward]);
          setModalVisible(false);
          message.success('奖励项目已添加');
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

  // 奖励表格列定义
  const rewardColumns = [
    {
      title: '奖励',
      key: 'reward',
      render: (text: any, record: Reward) => (
        <div className="reward-info">
          {record.imageUrl ? (
            <Avatar 
              shape="square" 
              size={64} 
              src={record.imageUrl} 
              className="reward-image"
            />
          ) : (
            <Avatar 
              shape="square" 
              size={64} 
              icon={<GiftOutlined />} 
              className="reward-image"
            />
          )}
          <div className="reward-text">
            <div className="reward-name">{record.name}</div>
            {record.description && (
              <div className="reward-description">{record.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '兑换币',
      dataIndex: 'coins',
      key: 'coins',
      render: (coins: number) => (
        <span className="coins-value">{coins}</span>
      ),
      sorter: (a: Reward, b: Reward) => a.coins - b.coins,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 5 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
      sorter: (a: Reward, b: Reward) => a.stock - b.stock,
    },
    {
      title: '已兑换次数',
      dataIndex: 'exchangeCount',
      key: 'exchangeCount',
      sorter: (a: Reward, b: Reward) => a.exchangeCount - b.exchangeCount,
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: Reward) => (
        <Space size="small">
          <Tooltip title="兑换">
            <Button 
              type="primary" 
              icon={<GiftOutlined />} 
              onClick={() => handleExchangeReward(record)}
              disabled={record.stock <= 0}
            >
              兑换
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditReward(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteReward(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 兑换记录表格列定义
  const exchangeColumns = [
    {
      title: '学生',
      key: 'student',
      render: (text: any, record: Exchange) => (
        <span>
          {record.student.name} ({record.student.studentId})
        </span>
      ),
    },
    {
      title: '奖励',
      key: 'reward',
      render: (text: any, record: Exchange) => record.reward.name,
    },
    {
      title: '兑换币',
      dataIndex: 'coins',
      key: 'coins',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: Exchange, b: Exchange) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as 'descend',
    },
  ];

  // 上传按钮
  const uploadButton = (
    <div>
      {imageLoading ? <LoadingOutlined /> : <PictureOutlined />}
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  // 渲染标签页内容
  const renderTabContent = () => {
    if (activeTab === 'rewards') {
      return (
        <div className="rewards-content">
          {loading ? (
            <div className="loading-container">加载中...</div>
          ) : rewards.length === 0 ? (
            <Empty description="暂无奖励项目" />
          ) : (
            <>
              <div className="view-mode-selector">
                <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
                  <Radio.Button value="table"><TableOutlined /> 表格视图</Radio.Button>
                  <Radio.Button value="card"><AppstoreOutlined /> 卡片视图</Radio.Button>
                </Radio.Group>
              </div>
              
              {viewMode === 'table' ? (
                <Table
                  columns={rewardColumns}
                  dataSource={rewards}
                  rowKey="_id"
                  pagination={false}
                />
              ) : (
                <Row gutter={[16, 16]} className="reward-cards-container">
                  {rewards.map(reward => (
                    <Col key={reward._id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="reward-card"
                        cover={
                          <div className="reward-card-cover">
                            {reward.imageUrl ? (
                              <img src={reward.imageUrl} alt={reward.name} />
                            ) : (
                              <GiftOutlined style={{ fontSize: 48, color: '#ccc' }} />
                            )}
                          </div>
                        }
                        actions={[
                          <Tooltip title="兑换">
                            <Button 
                              type="text" 
                              icon={<GiftOutlined />} 
                              onClick={() => handleExchangeReward(reward)}
                              disabled={reward.stock <= 0}
                            />
                          </Tooltip>,
                          <Tooltip title="编辑">
                            <Button 
                              type="text" 
                              icon={<EditOutlined />} 
                              onClick={() => handleEditReward(reward)}
                            />
                          </Tooltip>,
                          <Tooltip title="删除">
                            <Button 
                              type="text" 
                              danger
                              icon={<DeleteOutlined />} 
                              onClick={() => handleDeleteReward(reward._id)}
                            />
                          </Tooltip>
                        ]}
                      >
                        <div className="reward-card-content">
                          <div className="reward-card-title">{reward.name}</div>
                          <div className="reward-card-description">{reward.description || '无描述'}</div>
                          <div className="reward-card-footer">
                            <div className="reward-card-price">{reward.coins} 兑换币</div>
                            <Tag color={reward.stock > 5 ? 'green' : reward.stock > 0 ? 'orange' : 'red'}>
                              库存: {reward.stock}
                            </Tag>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </div>
      );
    } else {
      return (
        <div className="exchanges-content">
          {exchangesLoading ? (
            <div className="loading-container">加载中...</div>
          ) : exchanges.length === 0 ? (
            <Empty description="暂无兑换记录" />
          ) : (
            <Table
              columns={exchangeColumns}
              dataSource={exchanges}
              rowKey="_id"
              pagination={false}
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className="rewards-container">
      <div className="page-header">
        <div>
          <Title level={2} className="page-title">
            奖励兑换管理
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
          {activeTab === 'rewards' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddReward}
            >
              添加奖励项目
            </Button>
          )}
        </Space>
      </div>

      <Card className="rewards-card">
        <div className="tabs-header">
          <div 
            className={`tab-item ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            <GiftOutlined /> 奖励项目
          </div>
          <div 
            className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <HistoryOutlined /> 兑换记录
          </div>
        </div>
        <Divider style={{ margin: '0 0 16px 0' }} />
        {renderTabContent()}
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingReward ? '编辑奖励项目' : '添加奖励项目'}
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
            rules={[{ required: true, message: '请输入奖励名称' }]}
          >
            <Input placeholder="奖励名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea placeholder="奖励描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item
            name="imageUpload"
            label="图片"
          >
            <Upload
              name="image"
              listType="picture-card"
              className="image-uploader"
              showUploadList={false}
              action="/api/upload" // 实际开发中需要提供真实上传地址
              onChange={handleImageUpload}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="奖励图片" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                uploadButton
              )}
            </Upload>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              上传奖励的图片（可选），建议尺寸为200x200像素
            </Paragraph>
          </Form.Item>
          <Form.Item
            name="coins"
            label="兑换币"
            rules={[
              { required: true, message: '请输入所需兑换币数量' },
              { type: 'number', min: 1, message: '兑换币数量需大于0' },
            ]}
          >
            <InputNumber placeholder="所需兑换币数量" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存数量"
            rules={[
              { required: true, message: '请输入库存数量' },
              { type: 'number', min: 0, message: '库存数量不能为负数' },
            ]}
          >
            <InputNumber placeholder="库存数量" style={{ width: '100%' }} />
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

      {/* 兑换表单模态框 */}
      <Modal
        title="兑换奖励"
        open={exchangeModalVisible}
        onCancel={() => setExchangeModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {currentReward && (
          <div className="exchange-modal-content">
            <div className="reward-preview">
              {currentReward.imageUrl ? (
                <Avatar 
                  shape="square" 
                  size={64} 
                  src={currentReward.imageUrl} 
                  className="reward-image"
                />
              ) : (
                <Avatar 
                  shape="square" 
                  size={64} 
                  icon={<GiftOutlined />} 
                  className="reward-image"
                />
              )}
              <div className="reward-details">
                <div className="reward-name">{currentReward.name}</div>
                <div className="reward-cost">兑换币: {currentReward.coins}</div>
                <div className="reward-stock">库存: {currentReward.stock}</div>
              </div>
            </div>
            
            <Form
              form={exchangeForm}
              layout="vertical"
              onFinish={handleExchangeFormSubmit}
            >
              <Form.Item
                name="studentId"
                label="学生"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select 
                  placeholder="请选择学生" 
                  loading={studentsLoading} 
                  onChange={(value) => setSelectedStudent(value)}
                  optionFilterProp="children"
                  showSearch
                >
                  {students.map(student => (
                    <Select.Option 
                      key={student._id} 
                      value={student._id}
                      disabled={student.exchangeCoins < (currentReward?.coins || 0)}
                    >
                      {student.name} (学号: {student.studentId}) - 兑换币: {student.exchangeCoins}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              {selectedStudent && (
                <div className="student-coins-info">
                  {(() => {
                    const student = students.find((s: Student) => s._id === selectedStudent);
                    if (student && currentReward) {
                      const enoughCoins = student.exchangeCoins >= currentReward.coins;
                      const remainingCoins = student.exchangeCoins - currentReward.coins;
                      
                      return (
                        <>
                          <div className="current-coins">
                            当前兑换币: <span className="coin-value">{student.exchangeCoins}</span>
                          </div>
                          <div className="cost-coins">
                            消耗兑换币: <span className="coin-value">{currentReward.coins}</span>
                          </div>
                          <div className="remaining-coins">
                            兑换后剩余: <span className={`coin-value ${enoughCoins ? '' : 'insufficient'}`}>
                              {enoughCoins ? remainingCoins : '不足'}
                            </span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              
              <Divider />
              
              <Form.Item className="form-buttons">
                <Button onClick={() => setExchangeModalVisible(false)} style={{ marginRight: 8 }}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={confirmLoading}
                  disabled={Boolean(!selectedStudent || studentsLoading || 
                    (selectedStudent && ((students.find((s: Student) => s._id === selectedStudent)?.exchangeCoins ?? 0) < (currentReward?.coins || 0))))}
                >
                  确认兑换
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Rewards; 