import { describe, expect, it } from 'vitest'
import { detectPlatform } from '../src/lib/platform'

describe('detectPlatform', () => {
  it('Mac 的瀏覽層要認成 macos', () => {
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe('macos')
  })

  it('Windows 的瀏覽層要認成 other', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/130.0')).toBe('other')
  })
})
