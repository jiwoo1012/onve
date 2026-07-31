import React from 'react'
import { Link } from 'react-router-dom'
import QuantityControl from './QuantityControl'
import styles from './CartItem.module.scss'

const CartItem = ({ item, onChangeQuantity, onRemove }) => {
  const discountPrice = Math.round(item.price - (item.price * (item.discountRate || 0)) / 100)
  const itemTotal = discountPrice * item.quantity

  return (
    <article className={styles.item}>
      <Link to={`/products/${item.id}`} className={styles.imageArea}>
        <img src={item.image} alt={item.name} />
      </Link>

      <div className={styles.infoArea}>
        <Link to={`/products/${item.id}`} className={styles.name}>
          {item.name}
        </Link>

        <div className={styles.priceRow}>
          {item.discountRate > 0 && (
            <span className={styles.discountRate}>{item.discountRate}%</span>
          )}
          <span className={styles.price}>{discountPrice.toLocaleString()}원</span>
        </div>

        <QuantityControl
          quantity={item.quantity}
          setQuantity={(next) => {
            const nextQuantity = typeof next === 'function' ? next(item.quantity) : next
            onChangeQuantity(item.id, nextQuantity)
          }}
          maxQuantity={item.stock}
        />
      </div>

      <div className={styles.rightArea}>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(item.id)}
          aria-label="장바구니에서 삭제"
        >
          ✕
        </button>
        <strong className={styles.itemTotal}>{itemTotal.toLocaleString()}원</strong>
      </div>
    </article>
  )
}

export default CartItem