// language-switcher.js - 通用語言切換功能
;(function () {
  'use strict'

  /**
   * 智能語言切換函數
   * 根據當前頁面路徑切換到對應的語言版本
   */
  function changeLanguage(targetLanguagePath) {
    if (!targetLanguagePath) return

    const currentPath = window.location.pathname
    let newPath

    // 獲取當前語言前綴
    let currentLangPrefix = ''
    if (currentPath.startsWith('/ja/')) {
      currentLangPrefix = '/ja/'
    } else if (currentPath.startsWith('/zh-cn/')) {
      currentLangPrefix = '/zh-cn/'
    } else if (currentPath.startsWith('/zh-tw/')) {
      currentLangPrefix = '/zh-tw/'
    } else if (currentPath.startsWith('/ko/')) {
      currentLangPrefix = '/ko/'
    }

    // 獲取不含語言前綴的路徑
    let basePath = currentPath
    if (currentLangPrefix) {
      basePath = currentPath.substring(currentLangPrefix.length - 1) // 保留開頭的 "/"
      if (basePath === '/') {
        basePath = '/'
      }
    }

    // 如果目標是根路徑 "/"（英文版）
    if (targetLanguagePath === '/') {
      newPath = basePath
    }
    // 如果目標是其他語言版本
    else {
      if (basePath === '/') {
        newPath = targetLanguagePath
      } else {
        newPath = targetLanguagePath.slice(0, -1) + basePath // 移除末尾的 "/" 再加上 basePath
      }
    }

    // 如果路徑有變化，則跳轉
    if (newPath && newPath !== currentPath) {
      window.location.href = newPath
    }
  }

  /**
   * 初始化語言選擇器
   * 設置當前選中的語言選項
   */
  function initLanguageSelector() {
    const languageSelect = document.getElementById('language-select')
    if (!languageSelect) return

    const currentPath = window.location.pathname

    // 根據當前路徑設置選中的選項
    if (currentPath.startsWith('/ja/') || currentPath === '/ja') {
      languageSelect.value = '/ja/'
    } else if (currentPath.startsWith('/zh-cn/') || currentPath === '/zh-cn') {
      languageSelect.value = '/zh-cn/'
    } else if (currentPath.startsWith('/zh-tw/') || currentPath === '/zh-tw') {
      languageSelect.value = '/zh-tw/'
    } else if (currentPath.startsWith('/ko/') || currentPath === '/ko') {
      languageSelect.value = '/ko/'
    } else {
      languageSelect.value = '/'
    }
  }

  // 全局暴露函數
  window.changeLanguage = changeLanguage

  // 頁面載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSelector)
  } else {
    initLanguageSelector()
  }
})()
