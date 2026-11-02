import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Evaluation, Scenario } from '../core'
import { fmtBig } from '../lib/format'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
}

const RANGES = [
  { label: '5 年', months: 60 },
  { label: '10 年', months: 120 },
  { label: '20 年', months: 240 },
  { label: '全部 40 年', months: 480 },
]

interface Event {
  month: number
  text: string
}

interface Point {
  year: number
  gain: number
  loss: number
  cash: number
}

const yearText = (month: number) => {
  const years = Math.floor(month / 12)
  const rest = month % 12
  return rest === 0 ? `第 ${years} 年` : years === 0 ? `第 ${rest} 個月` : `第 ${years} 年 ${rest} 個月`
}

/** 現金推移：從買完房那天起，每個月的累計現金 */
export function CashChart({ scenario, evaluation: e }: Props) {
  const [rangeIndex, setRangeIndex] = useState(2)
  const horizon = RANGES[rangeIndex].months
  const startCash = Math.max(0, e.cashAfterReserve)

  const data = useMemo<Point[]>(() => {
    const points: Point[] = [{ year: 0, gain: startCash, loss: 0, cash: startCash }]
    for (const row of e.schedule.slice(0, horizon)) {
      points.push({ year: row.month / 12, gain: Math.max(0, row.cash), loss: Math.min(0, row.cash), cash: row.cash })
    }
    return points
  }, [e.schedule, horizon, startCash])

  const events = useMemo<Event[]>(() => {
    const list: Event[] = []
    if (e.runway.burnsCash && e.runway.months !== null) list.push({ month: e.runway.months, text: '存款用完' })
    if (e.runway.firstPositiveMonth !== null && e.runway.firstPositiveMonth > 1) {
      list.push({ month: e.runway.firstPositiveMonth, text: '每月收支轉正' })
    }
    scenario.loans.forEach((loan, index) => {
      const remaining = e.loans[index].remainingMonths
      if (!loan.settleOnSale && remaining !== null && remaining > 0 && remaining < 480) {
        list.push({ month: Math.round(remaining), text: `${loan.name}還完` })
      }
    })
    return list.sort((a, b) => a.month - b.month)
  }, [e.runway, e.loans, scenario.loans])

  const visibleEvents = events.filter((event) => event.month <= horizon)
  const lowest = Math.min(...data.map((point) => point.cash))

  return (
    <section className="chart-card" aria-label="現金推移">
      <header className="chart-head">
        <div>
          <h2>現金推移</h2>
          <p className="hint">買完房後，可動用的存款每月怎麼變。掉到 0 以下就是用完了。</p>
        </div>
        <div className="segmented" role="group" aria-label="圖表時間範圍">
          {RANGES.map((range, index) => (
            <button
              type="button"
              key={range.label}
              className={index === rangeIndex ? 'active' : ''}
              aria-pressed={index === rangeIndex}
              onClick={() => setRangeIndex(index)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </header>

      <dl className="chart-stats">
        <div>
          <dt>起點現金</dt>
          <dd>{fmtBig(startCash)}</dd>
        </div>
        <div>
          <dt>最低點</dt>
          <dd className={e.runway.lowestCash < 0 ? 'neg' : ''}>{fmtBig(e.runway.lowestCash)}</dd>
        </div>
        <div>
          <dt>存款用完</dt>
          <dd className={e.runway.months !== null ? 'neg' : 'pos'}>
            {e.runway.months === null ? (e.runway.burnsCash ? '撐過全程' : '不會用到') : yearText(e.runway.months)}
          </dd>
        </div>
      </dl>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--tone-steady)', stopOpacity: 0.55 }} />
                <stop offset="100%" style={{ stopColor: 'var(--tone-steady)', stopOpacity: 0.04 }} />
              </linearGradient>
              <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--tone-bad)', stopOpacity: 0.04 }} />
                <stop offset="100%" style={{ stopColor: 'var(--tone-bad)', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 4" style={{ stroke: 'var(--board-line)' }} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, horizon / 12]}
              ticks={Array.from({ length: Math.floor(horizon / 12 / (horizon > 240 ? 5 : horizon > 120 ? 2 : 1)) + 1 }, (_, i) => i * (horizon > 240 ? 5 : horizon > 120 ? 2 : 1))}
              tickFormatter={(value: number) => `${value} 年`}
              tickLine={false}
              axisLine={false}
              style={{ fill: 'var(--board-dim)', fontSize: 12 }}
            />
            <YAxis
              width={72}
              tickFormatter={(value: number) => fmtBig(value)}
              tickLine={false}
              axisLine={false}
              style={{ fill: 'var(--board-dim)', fontSize: 12 }}
            />
            <ReferenceLine y={0} style={{ stroke: 'var(--board-text)', strokeOpacity: 0.5 }} />
            {visibleEvents.map((event) => (
              <ReferenceLine
                key={`${event.text}-${event.month}`}
                x={event.month / 12}
                strokeDasharray="3 3"
                style={{ stroke: 'var(--board-dim)' }}
              />
            ))}
            <Tooltip
              cursor={{ style: { stroke: 'var(--board-dim)' } }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as Point
                const month = Math.round(point.year * 12)
                return (
                  <div className="chart-tip">
                    <b>{month === 0 ? '買完房那天' : yearText(month)}</b>
                    <span className={point.cash < 0 ? 'neg' : ''}>累計現金 {fmtBig(point.cash)}</span>
                  </div>
                )
              }}
            />
            <Area type="monotone" dataKey="gain" stroke="none" fill="url(#gainFill)" isAnimationActive={false} />
            <Area type="monotone" dataKey="loss" stroke="none" fill="url(#lossFill)" isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="cash"
              strokeWidth={2.2}
              style={{ stroke: 'var(--board-text)' }}
              isAnimationActive={false}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ul className="event-list">
        {visibleEvents.length === 0 && <li>這段期間沒有特別的轉折</li>}
        {visibleEvents.map((event) => (
          <li key={`${event.text}-${event.month}`}>
            <b>{yearText(event.month)}</b>
            {event.text}
          </li>
        ))}
        {lowest < 0 && (
          <li className="neg">
            <b>最低點</b>
            缺口約 {fmtBig(-lowest)}，要靠收入成長或賣資產補
          </li>
        )}
      </ul>
    </section>
  )
}
