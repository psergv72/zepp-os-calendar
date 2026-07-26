import { getText } from '@zos/i18n'
import { getLanguage } from '@zos/settings'

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const EN_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const RU_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const RU_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

let locale = null

function hasCyrillic(str) {
  return /[а-яА-ЯёЁ]/.test(str)
}

function toTitleFirst(str) {
  if (!str || str.length < 2) return str
  return str[0].toUpperCase() + str.slice(1).toLowerCase()
}

function to3title(str) {
  if (!str) return str
  return str[0].toUpperCase() + str.slice(1, 3).toLowerCase()
}

function ensureInit() {
  if (locale) return

  const sysMonths = MONTH_KEYS.map(k => getText(k))
  const hasRu = sysMonths.some(m => hasCyrillic(m))
  const isRu = hasRu || getLanguage() === 11

  const months = isRu ? RU_MONTHS : EN_MONTHS
  const days = isRu ? RU_DAYS : EN_DAYS
  const today = isRu ? 'Сегодня' : 'Today'

  const monthNames = MONTH_KEYS.map((k, i) => {
    const t = sysMonths[i]
    return (t && t !== k) ? to3title(t) : null
  })

  const dayNames = DAY_KEYS.map(k => toTitleFirst(getText(k)))

  const sysToday = getText('TODAY')

  locale = {
    firstDay: isRu ? 1 : 0,
    monthNames: monthNames[0] ? monthNames : months,
    dayNames: (dayNames[0] && dayNames[0].toUpperCase() !== DAY_KEYS[0]) ? dayNames : days,
    todayText: (sysToday && sysToday !== 'TODAY') ? sysToday : today,
  }
}

export function getFirstDayOfWeek() {
  ensureInit()
  return locale.firstDay
}

export function getMonthName(monthIndex) {
  ensureInit()
  return locale.monthNames[monthIndex]
}

export function getDayNames() {
  ensureInit()
  return locale.dayNames
}

export function getTodayText() {
  ensureInit()
  return locale.todayText
}
