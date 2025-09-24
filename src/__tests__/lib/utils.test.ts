import { describe, it, expect } from '@jest/globals'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined, false)).toBe('')
    })

    it('should handle complex Tailwind class merging', () => {
      // Test Tailwind class conflicts resolution
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
      expect(cn('text-red-500', 'text-blue-600')).toBe('text-blue-600')
    })

    it('should handle object syntax', () => {
      expect(cn({
        'base-class': true,
        'conditional-class': false,
        'active': true,
      })).toBe('base-class active')
    })
  })

  describe('Date utilities', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00Z')
      
      // Test various date formatting scenarios
      expect(testDate.toISOString().split('T')[0]).toBe('2024-01-15')
      expect(testDate.getFullYear()).toBe(2024)
      expect(testDate.getMonth()).toBe(0) // January is 0
      expect(testDate.getDate()).toBe(15)
    })

    it('should handle date comparisons', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-02')
      const date3 = new Date('2024-01-01')

      expect(date1 < date2).toBe(true)
      expect(date1.getTime()).toBe(date3.getTime())
    })

    it('should calculate date differences', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-08')
      
      const diffInMs = date2.getTime() - date1.getTime()
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      
      expect(diffInDays).toBe(7)
    })
  })

  describe('String utilities', () => {
    it('should capitalize strings correctly', () => {
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('tEST')).toBe('Test')
      expect(capitalize('')).toBe('')
    })

    it('should truncate strings correctly', () => {
      const truncate = (str: string, length: number) => 
        str.length > length ? str.slice(0, length) + '...' : str
      
      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Short', 10)).toBe('Short')
      expect(truncate('', 5)).toBe('')
    })

    it('should slugify strings correctly', () => {
      const slugify = (str: string) => 
        str.toLowerCase()
           .replace(/[^a-z0-9]+/g, '-')
           .replace(/^-|-$/g, '')
      
      expect(slugify('Hello World!')).toBe('hello-world')
      expect(slugify('Test @ #$% String')).toBe('test-string')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('Array utilities', () => {
    it('should remove duplicates correctly', () => {
      const removeDuplicates = <T>(arr: T[]): T[] => [...new Set(arr)]
      
      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('should group array items correctly', () => {
      const groupBy = <T, K extends string | number>(
        arr: T[], 
        keyFn: (item: T) => K
      ): Record<K, T[]> => {
        return arr.reduce((groups, item) => {
          const key = keyFn(item)
          groups[key] = groups[key] || []
          groups[key].push(item)
          return groups
        }, {} as Record<K, T[]>)
      }
      
      const items = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 30 },
      ]
      
      const grouped = groupBy(items, item => item.age)
      
      expect(grouped[25]).toHaveLength(2)
      expect(grouped[30]).toHaveLength(1)
      expect(grouped[25][0].name).toBe('Alice')
    })

    it('should sort arrays correctly', () => {
      const sortBy = <T>(arr: T[], keyFn: (item: T) => any): T[] => {
        return [...arr].sort((a, b) => {
          const aVal = keyFn(a)
          const bVal = keyFn(b)
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        })
      }
      
      const items = [
        { name: 'Charlie', priority: 3 },
        { name: 'Alice', priority: 1 },
        { name: 'Bob', priority: 2 },
      ]
      
      const sorted = sortBy(items, item => item.priority)
      
      expect(sorted[0].name).toBe('Alice')
      expect(sorted[1].name).toBe('Bob')
      expect(sorted[2].name).toBe('Charlie')
    })
  })

  describe('Object utilities', () => {
    it('should deep clone objects correctly', () => {
      const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))
      
      const original = {
        name: 'Test',
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      }
      
      const cloned = deepClone(original)
      cloned.nested.value = 100
      
      expect(original.nested.value).toBe(42)
      expect(cloned.nested.value).toBe(100)
    })

    it('should merge objects correctly', () => {
      const merge = <T extends object>(target: T, ...sources: Partial<T>[]): T => {
        return Object.assign({}, target, ...sources)
      }
      
      const base = { a: 1, b: 2 }
      const override = { b: 3, c: 4 }
      
      const result = merge(base, override)
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 })
      expect(base).toEqual({ a: 1, b: 2 }) // Original unchanged
    })

    it('should pick object properties correctly', () => {
      const pick = <T extends object, K extends keyof T>(
        obj: T, 
        keys: K[]
      ): Pick<T, K> => {
        const result = {} as Pick<T, K>
        keys.forEach(key => {
          if (key in obj) {
            result[key] = obj[key]
          }
        })
        return result
      }
      
      const original = { a: 1, b: 2, c: 3, d: 4 }
      const picked = pick(original, ['a', 'c'])
      
      expect(picked).toEqual({ a: 1, c: 3 })
      expect(Object.keys(picked)).toHaveLength(2)
    })
  })

  describe('Validation utilities', () => {
    it('should validate emails correctly', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }
      
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('should validate URLs correctly', () => {
      const isValidUrl = (url: string): boolean => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }
      
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('http://')).toBe(false)
    })

    it('should validate required fields correctly', () => {
      const isRequired = (value: any): boolean => {
        if (value === null || value === undefined) return false
        if (typeof value === 'string') return value.trim().length > 0
        if (Array.isArray(value)) return value.length > 0
        return true
      }
      
      expect(isRequired('test')).toBe(true)
      expect(isRequired('  test  ')).toBe(true)
      expect(isRequired('')).toBe(false)
      expect(isRequired('   ')).toBe(false)
      expect(isRequired(null)).toBe(false)
      expect(isRequired(undefined)).toBe(false)
      expect(isRequired([1, 2])).toBe(true)
      expect(isRequired([])).toBe(false)
    })
  })
})