import { buildDayPlan, clockToMinutes, minutesToClock, nextActionableBlock, planSummary } from './dayplan.ts'

let failures = 0
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) {
    failures++
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  } else {
    console.log(`ok   ${label}`)
  }
}

// --- clock <-> minutes ---
check('clockToMinutes 09:00', clockToMinutes('09:00'), 540)
check('clockToMinutes 17:30', clockToMinutes('17:30'), 1050)
check('minutesToClock 540', minutesToClock(540), '09:00')
check('minutesToClock 1050', minutesToClock(1050), '17:30')

// --- invalid input ---
check('workEnd before workStart yields warning', buildDayPlan(600, 500, []).warning !== null, true)

// --- short window (20-35 min): single block, no break ---
{
  const { blocks } = buildDayPlan(540, 570, []) // 09:00-09:30, 30 min
  check('30min window -> exactly one block', blocks.length, 1)
  check('30min window -> single focus block, no break', blocks[0], { type: 'focus', start: 540, end: 570, minutes: 30 })
}

// --- buffer window (<20 min): skipped entirely ---
{
  const { blocks, warning } = buildDayPlan(540, 555, []) // 09:00-09:15, 15 min
  check('15min window -> no blocks (buffer)', blocks.length, 0)
  check('15min window -> warning (nothing schedulable)', warning !== null, true)
}

// --- classic pomodoro chain window (35-120 min) ---
{
  const { blocks } = buildDayPlan(540, 615, []) // 09:00-10:15, 75 min -> 25+5+25+5+... fits 25,5,25,5 = 60, then 15 left (not enough for another 25)
  check('75min window -> chain types', blocks.map((b) => b.type), ['focus', 'break', 'focus', 'break'])
  check('75min window -> first focus 25min', blocks[0].minutes, 25)
  check('75min window -> break 5min', blocks[1].minutes, 5)
}

// --- long window (>120 min): 50/10 chain ---
{
  const { blocks } = buildDayPlan(480, 480 + 125, []) // 125 min -> >120 -> 50/10 chain: 50,10,50,10 fits (120), 5 left not enough
  check('125min window -> 50/10 chain types', blocks.map((b) => b.type), ['focus', 'break', 'focus', 'break'])
  check('125min window -> focus blocks are 50min', blocks[0].minutes, 50)
  check('125min window -> break is 10min', blocks[1].minutes, 10)
}

// --- every 4th break is a long break, in a big enough >120min window (50/10 chain) ---
{
  // 15:00-20:00, clear of the 12-14 lunch window: 50,10,50,10,50,10,50,longbreak(min(10*3,30)=30)
  const { blocks } = buildDayPlan(900, 900 + 300, [])
  const types = blocks.map((b) => b.type)
  check('300min window -> 4 focus blocks', types.filter((t) => t === 'focus').length, 4)
  check('300min window -> 4th break is a long break', types[types.length - 1], 'longbreak')
  check('300min window -> long break duration is 30min (min(10*3,30))', blocks[blocks.length - 1].minutes, 30)
}

// --- meeting carves out a gap, leaving buffer + workable windows around it ---
{
  const meetings = [{ start: 600, end: 630, title: 'Standup' }] // 10:00-10:30
  const { blocks } = buildDayPlan(540, 660, meetings) // 09:00-11:00 workday
  check('meeting appears as its own block', blocks.some((b) => b.type === 'meeting' && b.title === 'Standup'), true)
  // before meeting: 09:00-10:00 = 60min -> pomodoro chain; after: 10:30-11:00 = 30min -> single block
  check(
    'blocks chronologically sorted around meeting',
    blocks.map((b) => b.type),
    ['focus', 'break', 'focus', 'break', 'meeting', 'focus'],
  )
}

// --- overlapping meetings get merged for occupancy (no negative-length free window) ---
{
  const meetings = [
    { start: 600, end: 660, title: 'A' },
    { start: 630, end: 690, title: 'B' },
  ]
  const { blocks, warning } = buildDayPlan(540, 720, meetings) // 09:00-12:00, two overlapping meetings 10:00-11:30
  check('overlapping meetings do not crash / produce a plan', warning === null || warning !== undefined, true)
  check('both meeting blocks still individually present', blocks.filter((b) => b.type === 'meeting').length, 2)
}

// --- lunch window: explicit lunch break, no focus block placed directly over it ---
{
  const { blocks } = buildDayPlan(660, 900, []) // 11:00-15:00, spans the 12:00-14:00 lunch window
  const lunch = blocks.find((b) => b.title === 'Mittagspause')
  check('lunch block exists', Boolean(lunch), true)
  check('lunch block spans exactly 12:00-14:00', lunch, { type: 'break', start: 720, end: 840, minutes: 120, title: 'Mittagspause' })
  // 11:00-12:00 (60min) before lunch -> pomodoro chain; 14:00-15:00 (60min) after -> pomodoro chain
  check('no focus block overlaps the lunch window', blocks.every((b) => !(b.type === 'focus' && b.start < 840 && b.end > 720)), true)
}

// --- lunch window: only a sliver overlap (<15min) is NOT treated as a dedicated lunch break ---
{
  const { blocks } = buildDayPlan(540, 725, []) // 09:00-12:05, only 5 min inside the lunch window
  check('tiny lunch overlap -> no dedicated lunch block', blocks.some((b) => b.title === 'Mittagspause'), false)
}

// --- planSummary ---
{
  const { blocks } = buildDayPlan(540, 615, []) // 75min window -> focus,break,focus,break
  check('planSummary counts', planSummary(blocks), { focusCount: 2, focusMinutes: 50, breakCount: 2 })
}

// --- nextActionableBlock skips meeting entries ---
{
  const blocks = [
    { type: 'meeting' as const, start: 0, end: 10, minutes: 10 },
    { type: 'meeting' as const, start: 10, end: 20, minutes: 10 },
    { type: 'focus' as const, start: 20, end: 45, minutes: 25 },
    { type: 'break' as const, start: 45, end: 50, minutes: 5 },
  ]
  check('nextActionableBlock skips leading meetings', nextActionableBlock(blocks, 0), { block: blocks[2], index: 2 })
  check('nextActionableBlock from mid-list', nextActionableBlock(blocks, 3), { block: blocks[3], index: 3 })
  check('nextActionableBlock at end returns null', nextActionableBlock(blocks, 4), null)
}

if (failures > 0) {
  throw new Error(`${failures} test(s) failed.`)
}
console.log('\nAll day-plan tests passed.')
