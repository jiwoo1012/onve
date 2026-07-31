import React from 'react'
import { Link } from 'react-router-dom'
import { loadLocal, saveLocal } from '../utils/localStorage'
import useAuthStore from '../store/authStore'
import styles from './WishCard.module.scss'

const WishCard = ({ product, isRemoving, onRemove, onAddToCart }) => {
  const hasDiscount = product.discountRate > 0
  const discountPrice = hasDiscount
    ? Math.round(product.price - (product.price * product.discountRate) / 100)
    : product.price
  const isSoldOut = product.stock === 0

  const handleRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove(product.id)
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!useAuthStore.getState().user) {
      alert('로그인 후 이용해주세요.')
      return
    }
    if (isSoldOut) return

    const cartItem = loadLocal('cart', [])
    const existing = cartItem.find((item) => item.id === product.id)

    if (existing) {
      const updated = cartItem.map((item) =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      )
      saveLocal('cart', updated)
    } else {
      saveLocal('cart', [...cartItem, { ...product, quantity: 1 }])
    }

    onAddToCart(product)
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className={`${styles.flipCard} ${isRemoving ? styles.removing : ''}`}
    >
      <div className={styles.flipInner}>
        {/* 앞면 */}
        <div className={styles.front}>
          <div className={styles.imageArea}>
            <img src={product.image} alt={product.name} />
            {isSoldOut && <span className={styles.soldOutBadge}>SOLD OUT</span>}

            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
              aria-label="찜 목록에서 삭제"
            >
              ♥
            </button>
          </div>

          <div className={styles.information}>
            <p className={styles.category}>{product.category}</p>
            <p className={styles.name}>{product.name}</p>

            <div className={styles.priceArea}>
              {hasDiscount && <span className={styles.discountRate}>{product.discountRate}%</span>}
              <span className={styles.price}>{discountPrice.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 뒷면 */}
        <div className={styles.back}>
          <img src={product.image} alt="" className={styles.backImage} />
          <div className={styles.backOverlay} />

          <div className={styles.backContent}>
            <p className={styles.backCategory}>{product.category}</p>
            <p className={styles.backName}>{product.name}</p>
            <p className={styles.backPrice}>{discountPrice.toLocaleString()}원</p>

            <div className={styles.backActions}>
              <button
                type="button"
                className={styles.cartButton}
                onClick={handleAddToCart}
                disabled={isSoldOut}
              >
                {isSoldOut ? '품절' : '장바구니 담기'}
              </button>

              <button
                type="button"
                className={styles.unlikeButton}
                onClick={handleRemove}
              >
                찜 취소
              </button>
            </div>

            <span className={styles.viewMoreHint}>카드를 클릭하면 상세보기로 이동해요</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default WishCard
