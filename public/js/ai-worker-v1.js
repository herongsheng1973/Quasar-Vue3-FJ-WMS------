// ai-worker-v1.js - 调试 Worker，仅用于测试消息通信

console.log('AI Worker v1 已加载，等待消息...')

// 监听主线程发来的消息
self.onmessage = function (e) {
  console.log('Worker 收到消息:', e.data)

  const { action, data } = e.data
  // 回复一个测试消息
  self.postMessage({
    type: 'TEST_MESSAGE_RECEIVED',
    payload: e.data,
    timestamp: Date.now(),
    status: 'success',
    action: action,
    data: data,
  })
}
