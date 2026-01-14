/**
 * 錯誤處理工具函數
 */

import type { ApiError } from '../api/http'

/**
 * 從錯誤對象中提取用戶友好的錯誤消息
 */
export function getErrorMessage(error: unknown, defaultMessage: string = '操作失敗'): string {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError
    if (apiError.detail) return apiError.detail
    if (apiError.title) return apiError.title
    if (apiError.message && typeof apiError.message === 'string') return apiError.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return defaultMessage
}
