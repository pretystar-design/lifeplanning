import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { advisorAPI } from '../api';
import Navbar from '../components/Navbar';

function AdvisorChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const res = await advisorAPI.getConversations();
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);
  
  // 加载快捷问题
  const loadQuickQuestions = useCallback(async () => {
    try {
      const res = await advisorAPI.getQuickQuestions();
      setQuickQuestions(res.data.quick_questions);
    } catch (error) {
      console.error('Failed to load quick questions:', error);
    }
  }, []);
  
  // 加载当前对话的消息
  const loadMessages = useCallback(async (conversationId) => {
    try {
      const res = await advisorAPI.getMessages(conversationId);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);
  
  useEffect(() => {
    loadConversations();
    loadQuickQuestions();
  }, [loadConversations, loadQuickQuestions]);
  
  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);
  
  // 选择对话
  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
    setShowMobileSidebar(false);
  };
  
  // 创建新对话
  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setShowMobileSidebar(false);
  };
  
  // 删除对话
  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个对话吗？')) return;
    
    try {
      await advisorAPI.deleteConversation(conversationId);
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (error) {
      alert('删除失败');
    }
  };
  
  // 发送消息（流式）
  const handleSendMessage = async (messageText) => {
    if ((!messageText || !messageText.trim()) && !inputMessage.trim()) return;
    
    const text = messageText || inputMessage.trim();
    if (!text) return;
    
    setIsStreaming(true);
    setStreamingContent('');
    setInputMessage('');
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    
    // 如果没有当前对话，先创建
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      try {
        const res = await advisorAPI.createConversation({ title: text.substring(0, 50) });
        conversationId = res.data.conversation.id;
        setCurrentConversation(res.data.conversation);
        await loadConversations();
      } catch (error) {
        setIsStreaming(false);
        alert('创建对话失败');
        return;
      }
    }
    
    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // 获取token
      const token = localStorage.getItem('token');
      
      // 使用fetch + ReadableStream进行流式请求
      const response = await fetch(`/api/v1/finance/advisor/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId
        })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      // 处理流式响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'conversation_id') {
                // 新创建的对话ID
                continue;
              }
              
              if (data.done) {
                // 流结束
                break;
              }
              
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              
              if (data.error) {
                console.error('Stream error:', data.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      // 保存AI回复到服务器
      if (fullContent) {
        try {
          await advisorAPI.completeStream({
            conversation_id: conversationId,
            message: fullContent
          });
          
          // 添加AI消息到列表
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }
      
      // 刷新对话列表
      await loadConversations();
      
    } catch (error) {
      console.error('Chat error:', error);
      alert('发送消息失败，请稍后再试');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };
  
  // 处理回车发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container-fluid py-3">
        <div className="row g-0" style={{ height: 'calc(100vh - 76px)' }}>
          {/* 左侧对话列表 - 移动端可切换 */}
          <div className={`col-md-3 col-lg-3 bg-white border-end ${showMobileSidebar ? 'd-block' : 'd-none d-md-block'}`}>
            <div className="d-flex flex-column h-100">
              {/* 头部 */}
              <div className="p-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">💬 AI理财顾问</h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleNewConversation}
                  >
                    <i className="bi bi-plus-lg"></i>
                    新对话
                  </button>
                </div>
              </div>
              
              {/* 对话列表 */}
              <div className="flex-grow-1 overflow-auto">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                    <small>暂无对话记录</small>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${currentConversation?.id === conv.id ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="ms-2 me-auto">
                          <div className="fw-medium text-truncate" style={{ maxWidth: '180px' }}>
                            {conv.title || '新对话'}
                          </div>
                          <small className={currentConversation?.id === conv.id ? 'text-white-50' : 'text-muted'}>
                            {formatDate(conv.updated_at)} · {conv.message_count}条消息
                          </small>
                        </div>
                        <button
                          className={`btn btn-link btn-sm p-1 ${currentConversation?.id === conv.id ? 'text-white' : 'text-muted'}`}
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="删除对话"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 底部信息 */}
              <div className="p-3 border-top bg-light">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  AI建议仅供参考，不构成投资建议
                </small>
              </div>
            </div>
          </div>
          
          {/* 右侧聊天区域 */}
          <div className="col-md-9 col-lg-9 d-flex flex-column bg-light">
            {/* 移动端顶部栏 */}
            <div className="d-md-none p-2 bg-white border-bottom d-flex align-items-center">
              <button
                className="btn btn-outline-secondary btn-sm me-2"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              >
                <i className="bi bi-list"></i>
              </button>
              <span className="fw-medium">
                {currentConversation?.title || 'AI理财顾问'}
              </span>
            </div>
            
            {/* 消息区域 */}
            <div className="flex-grow-1 overflow-auto p-3 p-md-4">
              {messages.length === 0 && !isStreaming ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <span style={{ fontSize: '64px' }}>🤖</span>
                  </div>
                  <h4 className="mb-3">您好，我是理财规划师小慧</h4>
                  <p className="text-muted mb-4">
                    我可以帮您分析理财目标、优化资产配置、评估投资风险等。<br/>
                    有什么关于理财的问题都可以问我～
                  </p>
                  
                  {/* 快捷问题 */}
                  {quickQuestions.length > 0 && (
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {quickQuestions.map(q => (
                        <button
                          key={q.id}
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleSendMessage(q.question)}
                          disabled={isStreaming}
                        >
                          {q.icon} {q.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="messages-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`message mb-4 ${msg.role === 'user' ? 'd-flex justify-content-end' : 'd-flex justify-content-start'}`}
                    >
                      <div
                        className={`message-bubble p-3 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}
                        style={{ maxWidth: '75%' }}
                      >
                        <div className="message-content white-space: pre-wrap;" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.content}
                        </div>
                        <div className={`mt-1 ${msg.role === 'user' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 正在流式输出的消息 */}
                  {isStreaming && streamingContent && (
                    <div className="message mb-4 d-flex justify-content-start">
                      <div className="message-bubble p-3 rounded-3 bg-white shadow-sm" style={{ maxWidth: '75%' }}>
                        <div className="message-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {streamingContent}
                          <span className="typing-indicator">
                            <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* 输入区域 */}
            <div className="p-3 bg-white border-top">
              <div className="container">
                <div className="row">
                  <div className="col-12">
                    <div className="input-group" style={{ maxWidth: '800px', margin: '0 auto' }}>
                      <textarea
                        className="form-control"
                        placeholder="输入您的问题..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isStreaming}
                        rows="1"
                        style={{ resize: 'none', maxHeight: '120px' }}
                      />
                      <button
                        className="btn btn-primary px-4"
                        onClick={() => handleSendMessage()}
                        disabled={isStreaming || !inputMessage.trim()}
                      >
                        {isStreaming ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-send"></i>
                        )}
                      </button>
                    </div>
                    <div className="text-center mt-2">
                      <small className="text-muted">按 Enter 发送，Shift + Enter 换行</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 打字机效果样式 */}
      <style>{`
        .typing-indicator .dot {
          animation: blink 1.4s infinite both;
        }
        .typing-indicator .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        .white-space\\: pre-wrap {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}

export default AdvisorChatPage;
