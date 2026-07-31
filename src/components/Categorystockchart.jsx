import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import styles from './CategoryStockChart.module.scss'

const CATEGORY_LABELS = {
  LIFTING: '리프팅',
  SKINCARE: '스킨케어',
  CLEANSING: '클렌징',
  LED: 'LED 케어',
  BODY: '바디 케어',
  HAIR: '헤어 케어',
}

const BAR_DEFAULT = '#d9b878' // 기본 연한 브라운
const BAR_HIGHEST = '#9e733b'  // 최다 상품 카테고리 강조 브라운

const CategoryStockChart = ({ products = [] }) => {
  // 카테고리별 수량 집계
  const chartData = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      const key = product.category || product.categoryName || '기타'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([category, count]) => ({
      categoryKey: category,
      category: CATEGORY_LABELS[category] || category,
      count,
    }))
  }, [products])

  // 최다/최소 수량 카테고리 & Y축 최대 범위 자동 계산
  const { maxCount, maxCategoryNames, minCategoryNames, yDomainMax } = useMemo(() => {
    if (chartData.length === 0) {
      return { maxCount: 0, maxCategoryNames: '', minCategoryNames: '', yDomainMax: 6 }
    }

    let max = 0
    let min = Infinity

    chartData.forEach((d) => {
      if (d.count > max) max = d.count
      if (d.count < min) min = d.count
    })

    const maxes = chartData.filter((d) => d.count === max).map((d) => d.category)
    const mins = chartData.filter((d) => d.count === min).map((d) => d.category)

    const yMax = Math.max(6, max + 2)

    return {
      maxCount: max,
      maxCategoryNames: maxes.join(', '),
      minCategoryNames: mins.join(', '),
      yDomainMax: yMax,
    }
  }, [chartData])

  return (
    <div className={styles.chartBox}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>카테고리별 상품 분포</h3>
          <p className={styles.chartSubText}>등록된 상품의 카테고리별 수량 현황입니다.</p>
        </div>

        {chartData.length > 0 && (
          <div className={styles.chartInsightBadge}>
            <span className={styles.insightIcon}>💡</span>
            <span>
              <strong>{maxCategoryNames}</strong> 상품이 {maxCount}개로 가장 많습니다.
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 20, right: 12, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12.5, fill: '#2e2a22', fontWeight: 600 }}
            axisLine={{ stroke: '#ece5d8' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, yDomainMax]}
            tick={{ fontSize: 12, fill: '#594a3c' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(217, 184, 120, 0.12)' }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #ece5d8',
              fontSize: 13,
              color: '#2e2a22',
              fontWeight: 600,
            }}
          />
          <Bar
            dataKey="count"
            name="상품 수"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry) => {
              const isMax = entry.count === maxCount && maxCount > 0
              return (
                <Cell 
                  key={entry.category} 
                  fill={isMax ? BAR_HIGHEST : BAR_DEFAULT} 
                  className={styles.barCell}
                />
              )
            })}
            <LabelList 
              dataKey="count" 
              position="top" 
              style={{ fill: '#2e2a22', fontSize: 12.5, fontWeight: 800 }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {chartData.length > 0 && (
        <div className={styles.chartFooterSummary}>
          <span>
            • <strong>최다 보유:</strong> {maxCategoryNames} ({maxCount}개) &nbsp;|&nbsp; 
            • <strong>최소 보유:</strong> {minCategoryNames}
          </span>
        </div>
      )}
    </div>
  )
}

export default CategoryStockChart