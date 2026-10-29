// i18n.js - 多語言翻譯系統
;(function (global) {
  'use strict'

  // 翻譯字典
  const translations = {
    en: {
      // Game status messages
      'Your Turn': 'Your Turn',
      'AI Thinking...': 'AI Thinking...',
      'Click Start Game': 'Click Start Game',
      'You Win!': 'You Win!',
      'You Lose!': 'You Lose!',
      'Draw!': 'Draw!',
      'Game Not Started': 'Game Not Started',
      'Opponent Turn': 'Opponent Turn',
      'AI Thinking... (Depth {depth})': 'AI Thinking... (Depth {depth})',

      // System messages
      'Game over! {winner} wins!': 'Game over! {winner} wins!',
      "Game over! It's a draw!": "Game over! It's a draw!",
      'Your opponent has disconnected.': 'Your opponent has disconnected.',
      'New game started! {player} plays first.': 'New game started! {player} plays first.',
      Black: 'Black',
      White: 'White',
      'Copied!': 'Copied!',
      'Loading...': 'Loading...',
      'Failed to load room information': 'Failed to load room information',
      'Game started! You are playing as {color} stones.':
        'Game started! You are playing as {color} stones.',
      'Back to Online Battle': 'Back to Online Battle',
      'This room may have expired or the creator has left.':
        'This room may have expired or the creator has left.',
      'No Active Rooms': 'No Active Rooms',
      'Be the first to create a room and start playing!':
        'Be the first to create a room and start playing!',
      '{player} is waiting...': '{player} is waiting...',
      'Room is full': 'Room is full',
      'Room not found or expired': 'Room not found or expired',
      Waiting: 'Waiting',
      Playing: 'Playing',
      Private: 'Private',
      Room: 'Room',
      'Private Room': 'Private Room',

      // Difficulty options
      Easy: 'Easy',
      Medium: 'Medium',
      Hard: 'Hard',

      // Difficulty info
      'Easy Mode: AI makes some mistakes, suitable for beginners':
        'Easy Mode: AI makes some mistakes, suitable for beginners',
      'Medium Mode: AI has strategic thinking, suitable for general players':
        'Medium Mode: AI has strategic thinking, suitable for general players',
      'Hard Mode: AI uses advanced algorithms, extremely challenging!':
        'Hard Mode: AI uses advanced algorithms, extremely challenging!',
      '🚀 Background AI: Maximum strength, smooth UI':
        '🚀 Background AI: Maximum strength, smooth UI',
    },
    ja: {
      // Game status messages
      'Your Turn': 'あなたのターン',
      'AI Thinking...': 'AI思考中...',
      'Click Start Game': 'スタートゲームをクリック',
      'You Win!': '勝利！',
      'You Lose!': '敗北！',
      'Draw!': '引き分け！',
      'Game Not Started': 'ゲーム未開始',
      'Opponent Turn': '相手のターン',
      'AI Thinking... (Depth {depth})': 'AI思考中... (深度{depth})',

      // System messages
      'Game over! {winner} wins!': 'ゲーム終了！{winner}の勝利！',
      "Game over! It's a draw!": 'ゲーム終了！引き分けです！',
      'Your opponent has disconnected.': '相手が切断されました。',
      'New game started! {player} plays first.':
        '新しいゲームが開始されました！{player}が先手です。',
      Black: '黒',
      White: '白',
      'Copied!': 'コピーしました！',
      'Loading...': '読み込み中...',
      'Failed to load room information': 'ルーム情報の読み込みに失敗しました',
      'Game started! You are playing as {color} stones.':
        'ゲーム開始！あなたは{color}の石でプレイします。',
      'Back to Online Battle': 'オンライン対戦に戻る',
      'This room may have expired or the creator has left.':
        'このルームは期限切れか、作成者が退出した可能性があります。',
      'No Active Rooms': 'アクティブなルームがありません',
      'Be the first to create a room and start playing!':
        '最初にルームを作成してプレイを開始しましょう！',
      '{player} is waiting...': '{player}が待機中...',
      'Room is full': 'ルームが満員です',
      'Room not found or expired': 'ルームが見つからないか期限切れです',
      Waiting: '待機中',
      Playing: 'プレイ中',
      Private: 'プライベート',
      Room: 'ルーム',
      'Private Room': 'プライベートルーム',

      // Difficulty options
      Easy: '簡単',
      Medium: '普通',
      Hard: '難しい',

      // Difficulty info
      'Easy Mode: AI makes some mistakes, suitable for beginners':
        '簡単モード：AIがミスをすることがあり、初心者に適しています',
      'Medium Mode: AI has strategic thinking, suitable for general players':
        '普通モード：AIに戦略的思考があり、一般プレイヤーに適しています',
      'Hard Mode: AI uses advanced algorithms, extremely challenging!':
        '難しいモード：AIが高度なアルゴリズムを使用し、非常に挑戦的です！',
      '🚀 Background AI: Maximum strength, smooth UI':
        '🚀 バックグラウンドAI：最大強度、スムーズなUI',
    },
    'zh-cn': {
      // Game status messages
      'Your Turn': '您的回合',
      'AI Thinking...': 'AI思考中...',
      'Click Start Game': '点击开始游戏',
      'You Win!': '您获胜！',
      'You Lose!': '您输了！',
      'Draw!': '平局！',
      'Game Not Started': '游戏未开始',
      'Opponent Turn': '对手回合',
      'AI Thinking... (Depth {depth})': 'AI思考中... (深度{depth})',

      // System messages
      'Game over! {winner} wins!': '游戏结束！{winner}获胜！',
      "Game over! It's a draw!": '游戏结束！平局！',
      'Your opponent has disconnected.': '您的对手已断开连接。',
      'New game started! {player} plays first.': '新游戏开始！{player}先手。',
      Black: '黑',
      White: '白',
      'Copied!': '已复制！',
      'Loading...': '加载中...',
      'Failed to load room information': '加载房间信息失败',
      'Game started! You are playing as {color} stones.': '游戏开始！您使用{color}子。',
      'Back to Online Battle': '返回在线对战',
      'This room may have expired or the creator has left.': '此房间可能已过期或创建者已离开。',
      'No Active Rooms': '暂无活跃房间',
      'Be the first to create a room and start playing!': '成为第一个创建房间并开始游戏的人！',
      '{player} is waiting...': '{player}等待中...',
      'Room is full': '房间已满',
      'Room not found or expired': '房间未找到或已过期',
      Waiting: '等待中',
      Playing: '游戏中',
      Private: '私人',
      Room: '房间',
      'Private Room': '私人房间',

      // Difficulty options
      Easy: '简单',
      Medium: '中等',
      Hard: '困难',

      // Difficulty info
      'Easy Mode: AI makes some mistakes, suitable for beginners':
        '简单模式：AI会犯一些错误，适合初学者',
      'Medium Mode: AI has strategic thinking, suitable for general players':
        '中等模式：AI具有战略思维，适合一般玩家',
      'Hard Mode: AI uses advanced algorithms, extremely challenging!':
        '困难模式：AI使用高级算法，极具挑战性！',
      '🚀 Background AI: Maximum strength, smooth UI': '🚀 后台AI：最大强度，流畅界面',
    },
    'zh-tw': {
      // Game status messages
      'Your Turn': '您的回合',
      'AI Thinking...': 'AI思考中...',
      'Click Start Game': '點擊開始遊戲',
      'You Win!': '您獲勝！',
      'You Lose!': '您輸了！',
      'Draw!': '平局！',
      'Game Not Started': '遊戲未開始',
      'Opponent Turn': '對手回合',
      'AI Thinking... (Depth {depth})': 'AI思考中... (深度{depth})',

      // System messages
      'Game over! {winner} wins!': '遊戲結束！{winner}獲勝！',
      "Game over! It's a draw!": '遊戲結束！平局！',
      'Your opponent has disconnected.': '您的對手已斷開連接。',
      'New game started! {player} plays first.': '新遊戲開始！{player}先手。',
      Black: '黑',
      White: '白',
      'Copied!': '已複製！',
      'Loading...': '載入中...',
      'Failed to load room information': '載入房間資訊失敗',
      'Game started! You are playing as {color} stones.': '遊戲開始！您使用{color}子。',
      'Back to Online Battle': '返回線上對戰',
      'This room may have expired or the creator has left.': '此房間可能已過期或創建者已離開。',
      'No Active Rooms': '暫無活躍房間',
      'Be the first to create a room and start playing!': '成為第一個創建房間並開始遊戲的人！',
      '{player} is waiting...': '{player}等待中...',
      'Room is full': '房間已滿',
      'Room not found or expired': '房間未找到或已過期',
      Waiting: '等待中',
      Playing: '遊戲中',
      Private: '私人',
      Room: '房間',
      'Private Room': '私人房間',

      // Difficulty options
      Easy: '簡單',
      Medium: '中等',
      Hard: '困難',

      // Difficulty info
      'Easy Mode: AI makes some mistakes, suitable for beginners':
        '簡單模式：AI會犯一些錯誤，適合初學者',
      'Medium Mode: AI has strategic thinking, suitable for general players':
        '中等模式：AI具有戰略思維，適合一般玩家',
      'Hard Mode: AI uses advanced algorithms, extremely challenging!':
        '困難模式：AI使用高級算法，極具挑戰性！',
      '🚀 Background AI: Maximum strength, smooth UI': '🚀 後台AI：最大強度，流暢介面',
    },
    ko: {
      // Game status messages
      'Your Turn': '당신의 차례',
      'AI Thinking...': 'AI 생각 중...',
      'Click Start Game': '게임 시작 클릭',
      'You Win!': '승리!',
      'You Lose!': '패배!',
      'Draw!': '무승부!',
      'Game Not Started': '게임 시작 안됨',
      'Opponent Turn': '상대방 차례',
      'AI Thinking... (Depth {depth})': 'AI 생각 중... (깊이 {depth})',

      // System messages
      'Game over! {winner} wins!': '게임 종료! {winner} 승리!',
      "Game over! It's a draw!": '게임 종료! 무승부입니다!',
      'Your opponent has disconnected.': '상대방이 연결을 끊었습니다.',
      'New game started! {player} plays first.': '새 게임 시작! {player}이(가) 선수입니다.',
      Black: '흑',
      White: '백',
      'Copied!': '복사됨!',
      'Loading...': '로딩 중...',
      'Failed to load room information': '방 정보 로드 실패',
      'Game started! You are playing as {color} stones.':
        '게임 시작! 당신은 {color} 돌로 플레이합니다.',
      'Back to Online Battle': '온라인 대전으로 돌아가기',
      'This room may have expired or the creator has left.':
        '이 방은 만료되었거나 생성자가 떠났을 수 있습니다.',
      'No Active Rooms': '활성 방 없음',
      'Be the first to create a room and start playing!':
        '첫 번째로 방을 만들고 게임을 시작하세요!',
      '{player} is waiting...': '{player} 대기 중...',
      'Room is full': '방이 가득참',
      'Room not found or expired': '방을 찾을 수 없거나 만료됨',
      Waiting: '대기 중',
      Playing: '플레이 중',
      Private: '비공개',
      Room: '방',
      'Private Room': '비공개 방',

      // Difficulty options
      Easy: '쉬움',
      Medium: '보통',
      Hard: '어려움',

      // Difficulty info
      'Easy Mode: AI makes some mistakes, suitable for beginners':
        '쉬움 모드: AI가 실수를 하므로 초보자에게 적합',
      'Medium Mode: AI has strategic thinking, suitable for general players':
        '보통 모드: AI가 전략적 사고를 하므로 일반 플레이어에게 적합',
      'Hard Mode: AI uses advanced algorithms, extremely challenging!':
        '어려움 모드: AI가 고급 알고리즘을 사용하므로 매우 도전적입니다!',
      '🚀 Background AI: Maximum strength, smooth UI': '🚀 백그라운드 AI: 최대 강도, 부드러운 UI',
    },
  }

  // 當前語言設定
  let currentLang = 'en'

  // i18n 對象
  const i18n = {
    // 初始化語言設定
    init: function () {
      // 從URL路徑檢測語言
      const path = window.location.pathname
      if (path.startsWith('/ja/') || path === '/ja') {
        currentLang = 'ja'
      } else if (path.startsWith('/zh-cn/') || path === '/zh-cn') {
        currentLang = 'zh-cn'
      } else if (path.startsWith('/zh-tw/') || path === '/zh-tw') {
        currentLang = 'zh-tw'
      } else if (path.startsWith('/ko/') || path === '/ko') {
        currentLang = 'ko'
      } else {
        currentLang = 'en'
      }
      console.log('i18n initialized with language:', currentLang)
    },

    // 獲取當前語言
    getCurrentLang: function () {
      return currentLang
    },

    // 設置語言
    setLang: function (lang) {
      if (translations[lang]) {
        currentLang = lang
        console.log('Language changed to:', currentLang)
      }
    },

    // 翻譯函數
    t: function (key, params = {}) {
      const translation = translations[currentLang] && translations[currentLang][key]
      if (!translation) {
        console.warn('Translation missing for key:', key, 'in language:', currentLang)
        return key // 返回原始key作為fallback
      }

      // 替換參數
      let result = translation
      Object.keys(params).forEach((param) => {
        const placeholder = '{' + param + '}'
        result = result.replace(new RegExp(placeholder, 'g'), params[param])
      })

      return result
    },

    // 翻譯難度選擇器選項
    translateDifficultyOptions: function () {
      const difficultySelector = document.getElementById('difficulty')
      if (!difficultySelector) return

      const options = difficultySelector.querySelectorAll('option')
      options.forEach((option) => {
        const originalText = option.textContent.trim()
        const translatedText = this.t(originalText)
        if (translatedText !== originalText) {
          option.textContent = translatedText
        }
      })
    },
  }

  // 全局暴露
  global.i18n = i18n

  // 自動初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      i18n.init()
      // 延遲一點執行翻譯，確保DOM完全載入
      setTimeout(() => {
        i18n.translateDifficultyOptions()
      }, 100)
    })
  } else {
    i18n.init()
    // 延遲一點執行翻譯，確保DOM完全載入
    setTimeout(() => {
      i18n.translateDifficultyOptions()
    }, 100)
  }
})(window)
