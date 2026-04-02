import { EXPIRY_NOTICE_DAYS } from '../tier-thresholds'

describe('Tier validity date helpers', () => {
  describe('EXPIRY_NOTICE_DAYS', () => {
    it('is 30 days', () => {
      expect(EXPIRY_NOTICE_DAYS).toBe(30)
    })
  })

  describe('isExpiring computation', () => {
    const now = new Date('2026-04-02T12:00:00Z')

    function isExpiring(validUntil: Date | null): boolean {
      if (!validUntil) return false
      const msPerDay = 1000 * 60 * 60 * 24
      const daysUntil = (validUntil.getTime() - now.getTime()) / msPerDay
      return daysUntil > 0 && daysUntil <= EXPIRY_NOTICE_DAYS
    }

    function isExpired(validUntil: Date | null): boolean {
      if (!validUntil) return false
      return validUntil < now
    }

    it('returns false for null validUntil (legacy)', () => {
      expect(isExpiring(null)).toBe(false)
      expect(isExpired(null)).toBe(false)
    })

    it('returns isExpiring=true when validUntil is within 30 days', () => {
      expect(isExpiring(new Date('2026-04-15T00:00:00Z'))).toBe(true)
    })

    it('returns isExpiring=true when validUntil is exactly 30 days away', () => {
      expect(isExpiring(new Date('2026-05-02T12:00:00Z'))).toBe(true)
    })

    it('returns isExpiring=false when validUntil is more than 30 days away', () => {
      expect(isExpiring(new Date('2026-06-01T00:00:00Z'))).toBe(false)
    })

    it('returns isExpiring=false when validUntil is in the past', () => {
      expect(isExpiring(new Date('2026-03-15T00:00:00Z'))).toBe(false)
    })

    it('returns isExpired=true when validUntil is in the past', () => {
      expect(isExpired(new Date('2026-03-15T00:00:00Z'))).toBe(true)
    })

    it('returns isExpired=false when validUntil is in the future', () => {
      expect(isExpired(new Date('2026-06-01T00:00:00Z'))).toBe(false)
    })
  })

  describe('validUntil default calculation', () => {
    it('computes today + 12 months rounded to end of month', () => {
      // 2026-04-02 -> +12 months -> 2027-04 -> end of month -> 2027-04-30
      const today = new Date('2026-04-02')
      const d = new Date(today)
      d.setMonth(d.getMonth() + 12)
      d.setMonth(d.getMonth() + 1, 0) // end of month
      expect(d.getFullYear()).toBe(2027)
      expect(d.getMonth()).toBe(3) // April (0-indexed)
      expect(d.getDate()).toBe(30)
    })

    it('handles January -> January end of month', () => {
      const today = new Date('2026-01-15')
      const d = new Date(today)
      d.setMonth(d.getMonth() + 12)
      d.setMonth(d.getMonth() + 1, 0)
      expect(d.getFullYear()).toBe(2027)
      expect(d.getMonth()).toBe(0) // January
      expect(d.getDate()).toBe(31)
    })

    it('handles February leap year', () => {
      const today = new Date('2027-02-10')
      const d = new Date(today)
      d.setMonth(d.getMonth() + 12)
      d.setMonth(d.getMonth() + 1, 0)
      // 2028 is a leap year, February has 29 days
      expect(d.getFullYear()).toBe(2028)
      expect(d.getMonth()).toBe(1) // February
      expect(d.getDate()).toBe(29)
    })
  })
})
