import React from 'react'
import styles from './ProductSort.module.scss'

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'newest', label: '신상품순' },
  { value: 'priceAsc', label: '낮은 가격순' },
  { value: 'priceDesc', label: '높은 가격순' },
  { value: 'name', label: '가나다순' },
]

const ProductSort = ({ sortBy, setSortBy }) => {
  return (
    <div className={styles.sort}>
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.sortButton} ${sortBy === option.value ? styles.active : ''}`}
          onClick={() => setSortBy(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default ProductSort