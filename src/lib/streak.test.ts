import { daysBetween, streakOnHarvest, streakOnNewDay } from './streak.ts'

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

// --- daysBetween ---
check('daysBetween same day', daysBetween('2026-08-15', '2026-08-15'), 0)
check('daysBetween consecutive', daysBetween('2026-08-15', '2026-08-16'), 1)
check('daysBetween gap of 2', daysBetween('2026-08-15', '2026-08-17'), 2)
check('daysBetween across month boundary', daysBetween('2026-08-31', '2026-09-01'), 1)
check('daysBetween across year boundary', daysBetween('2026-12-31', '2027-01-01'), 1)
// leap year: 2028 is a leap year, so Feb has 29 days
check('daysBetween across leap day', daysBetween('2028-02-28', '2028-03-01'), 2)
check('daysBetween empty lastHarvestDate (first ever use)', daysBetween('', '2026-08-15'), Infinity)
check('daysBetween reversed (should not happen, but stay sane)', daysBetween('2026-08-16', '2026-08-15'), -1)

// --- streakOnNewDay (app opened on a fresh day, no harvest yet today) ---
check('newDay: yesterday harvested, streak continues pending', streakOnNewDay(4, '2026-08-14', '2026-08-15'), 4)
check('newDay: gap of 2 breaks streak', streakOnNewDay(4, '2026-08-13', '2026-08-15'), 0)
check('newDay: gap of many days breaks streak', streakOnNewDay(10, '2026-07-01', '2026-08-15'), 0)
check('newDay: same day (no-op, would not normally be called)', streakOnNewDay(4, '2026-08-15', '2026-08-15'), 4)
check('newDay: never harvested before (empty lastHarvestDate)', streakOnNewDay(0, '', '2026-08-15'), 0)

// --- streakOnHarvest (a focus session just completed) ---
check('harvest: very first harvest ever', streakOnHarvest(0, '', '2026-08-15'), 1)
check('harvest: second harvest same day, unchanged', streakOnHarvest(1, '2026-08-15', '2026-08-15'), 1)
check('harvest: third harvest same day, still unchanged', streakOnHarvest(1, '2026-08-15', '2026-08-15'), 1)
check('harvest: consecutive day increments', streakOnHarvest(4, '2026-08-14', '2026-08-15'), 5)
check('harvest: after skipping one day resets to 1', streakOnHarvest(4, '2026-08-13', '2026-08-15'), 1)
check('harvest: after skipping many days resets to 1', streakOnHarvest(30, '2026-01-01', '2026-08-15'), 1)
check('harvest: across month boundary, consecutive', streakOnHarvest(2, '2026-08-31', '2026-09-01'), 3)
check('harvest: across year boundary, consecutive', streakOnHarvest(9, '2026-12-31', '2027-01-01'), 10)
check('harvest: across leap day gap (Feb 28 -> Mar 1 is a 2-day gap in a leap year)', streakOnHarvest(3, '2028-02-28', '2028-03-01'), 1)

// --- full multi-day simulation: walk a sequence of app opens / harvests across a whole week ---
{
  let streak = 0
  let lastHarvestDate = ''
  let todaysHarvest: string[] = []

  function openApp(today: string) {
    if (lastHarvestDate !== today) {
      streak = streakOnNewDay(streak, lastHarvestDate, today)
      todaysHarvest = []
    }
  }
  function harvest(today: string) {
    streak = streakOnHarvest(streak, lastHarvestDate, today)
    lastHarvestDate = today
    todaysHarvest.push('tomato')
  }

  // Day 1: open + harvest twice
  openApp('2026-08-10')
  harvest('2026-08-10')
  harvest('2026-08-10')
  check('week-sim day1 streak', streak, 1)
  check('week-sim day1 todaysHarvest count', todaysHarvest.length, 2)

  // Day 2: consecutive, one harvest
  openApp('2026-08-11')
  check('week-sim day2 open (pending) streak', streak, 1)
  check('week-sim day2 open resets todaysHarvest', todaysHarvest.length, 0)
  harvest('2026-08-11')
  check('week-sim day2 after harvest streak', streak, 2)

  // Day 3: app never opened, but user harvests directly (harvest() alone should still work)
  harvest('2026-08-12')
  check('week-sim day3 direct harvest streak', streak, 3)
  // NOTE: todaysHarvest still has day2's leftover fruit here because openApp('2026-08-12')
  // was never called in this branch - this models exactly the "tab stayed open across
  // midnight" bug scenario the app must guard against at the reducer level (TICK),
  // not just via openApp/initState. The pure streak math (above) is correct either way;
  // todaysHarvest hygiene is the reducer's job (see store.tsx: activeDayKey tracking).

  // Day 4: user skips entirely (no open, no harvest)
  // Day 5: user opens app - gap since day3 is 2, streak should break
  openApp('2026-08-14')
  check('week-sim day5 after skipping day4 streak breaks', streak, 0)
  harvest('2026-08-14')
  check('week-sim day5 after harvest restarts at 1', streak, 1)
}

if (failures > 0) {
  throw new Error(`${failures} test(s) failed.`)
}
console.log('\nAll streak tests passed.')
