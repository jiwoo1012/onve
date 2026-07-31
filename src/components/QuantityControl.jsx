import React from 'react'
import styles from './QuantityControl.module.scss'

const QuantityControl = ({ quantity, setQuantity, maxQuantity, disabled = false }) => {
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1)
    }
  }

  const isAtMinimum = quantity <= 1
  const isAtMaximum = quantity >= maxQuantity

  return (
    <div className={styles.quantityControl}>
      <button
        type="button"
        className={styles.button}
        onClick={decreaseQuantity}
        disabled={disabled || isAtMinimum}
      >
        −
      </button>
      <span className={styles.count}>{quantity}</span>
      <button
        type="button"
        className={styles.button}
        onClick={increaseQuantity}
        disabled={disabled || isAtMaximum}
      >
        +
      </button>
    </div>
  )
}

export default QuantityControl
