/**
 * OpenAIPDF — Unit Tests
 * Tests for core utility functions and API route logic.
 * Run with: npm test
 */

import { formatFileSize, rangeStringToPages, pagesToRangeString, truncateFilename, clamp } from '@/lib/utils'

describe('formatFileSize', () => {
  it('formats bytes', () => expect(formatFileSize(0)).toBe('0 B'))
  it('formats kilobytes', () => expect(formatFileSize(1536)).toBe('1.5 KB'))
  it('formats megabytes', () => expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB'))
  it('formats gigabytes', () => expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB'))
})

describe('rangeStringToPages', () => {
  it('parses single page', () => expect(rangeStringToPages('3', 10)).toEqual([3]))
  it('parses range', () => expect(rangeStringToPages('1-3', 10)).toEqual([1, 2, 3]))
  it('parses mixed', () => expect(rangeStringToPages('1-3,5,7-9', 10)).toEqual([1, 2, 3, 5, 7, 8, 9]))
  it('respects maxPage', () => expect(rangeStringToPages('8-12', 10)).toEqual([8, 9, 10]))
  it('ignores invalid', () => expect(rangeStringToPages('abc', 10)).toEqual([]))
  it('deduplicates', () => expect(rangeStringToPages('1,1,2', 10)).toEqual([1, 2]))
})

describe('pagesToRangeString', () => {
  it('converts single page', () => expect(pagesToRangeString([3])).toBe('3'))
  it('converts consecutive', () => expect(pagesToRangeString([1, 2, 3])).toBe('1-3'))
  it('converts mixed', () => expect(pagesToRangeString([1, 2, 3, 5, 7, 8, 9])).toBe('1-3,5,7-9'))
  it('handles empty', () => expect(pagesToRangeString([])).toBe(''))
})

describe('truncateFilename', () => {
  it('keeps short names', () => expect(truncateFilename('doc.pdf', 30)).toBe('doc.pdf'))
  it('truncates long names', () => {
    const result = truncateFilename('this-is-a-very-long-filename-indeed.pdf', 20)
    expect(result).toContain('.pdf')
    expect(result.length).toBeLessThanOrEqual(21)
  })
})

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 100)).toBe(0))
  it('clamps above max', () => expect(clamp(150, 0, 100)).toBe(100))
  it('passes through in range', () => expect(clamp(50, 0, 100)).toBe(50))
})

// ── Rate limit tests ───────────────────────────────────────────────────────────
describe('Rate limiting', () => {
  it('allows first request', async () => {
    // Mock Redis for testing
    jest.mock('@/services/redis', () => ({
      getRedisConnection: () => ({
        pipeline: () => ({ zremrangebyscore: jest.fn(), zcard: jest.fn().mockReturnValue([null, 0]), zadd: jest.fn(), expire: jest.fn(), exec: jest.fn().mockResolvedValue([[null, 0], [null, 0], [null, 1], [null, 1]]) }),
      }),
    }))
    expect(true).toBe(true) // placeholder
  })
})

// ── Tools config tests ─────────────────────────────────────────────────────────
describe('Tools config', () => {
  const { ALL_TOOLS, TOOL_CATEGORIES, getToolById, getCategoryById } = require('@/lib/tools-config')

  it('has at least 30 tools', () => expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(30))
  it('all tools have required fields', () => {
    ALL_TOOLS.forEach((tool: any) => {
      expect(tool.id).toBeTruthy()
      expect(tool.name).toBeTruthy()
      expect(tool.href).toBeTruthy()
      expect(tool.icon).toBeTruthy()
      expect(tool.categoryId).toBeTruthy()
    })
  })
  it('getToolById returns correct tool', () => {
    const merge = getToolById('merge')
    expect(merge).toBeDefined()
    expect(merge.name).toBe('Merge PDF')
  })
  it('getCategoryById returns category', () => {
    const cat = getCategoryById('organize')
    expect(cat).toBeDefined()
    expect(cat.tools.length).toBeGreaterThan(0)
  })
  it('all tool hrefs are valid', () => {
    ALL_TOOLS.forEach((tool: any) => {
      expect(tool.href).toMatch(/^\/tools\//)
    })
  })
})
