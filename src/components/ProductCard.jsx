import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadLocal, saveLocal } from '../utils/localStorage'
import useAuthStore from '../store/authStore'
import styles from './ProductCard.module.scss'

const ProductCard = ({ product, onWishItem }) => {
  // 찜 기능 추가
  const saveWish=loadLocal('wishlist', [])
  let isproduct=false

  // 현재 넘어온 상품 1개 (product) 찜한 상품 목록 중에서 일차하는 상품 찾기
  for(let i=0; i<saveWish.length; i++){
    const wishPro = saveWish[i]
      if( wishPro.id === product.id ){
        isproduct=true
        break
      }
  }
  const [isLiked, setIsLiked] = useState(isproduct)
  const isSoldOut = Number(product.stock) <= 0

  const hasDiscount = product.discountRate > 0
  const discountPrice = hasDiscount
    ? Math.round(product.price - (product.price * product.discountRate) / 100)
    : product.price

  const changeWishlist = () => {
  if (!useAuthStore.getState().user) {
    alert('로그인 후 이용해주세요.')
    return
  }
  const wishItem = loadLocal('wishlist', [])
  const newIsLiked = !isLiked

  if (newIsLiked) {
      // 같은 상품이 없으므로 찜한 상품을 찜 목록에 추가한다.
      saveLocal('wishlist', [...wishItem, product])
    } else {
      // 좋아요를 한 번 더 클릭한 상태(취소 상태)
      const remItem = wishItem.filter((item) => item.id !== product.id)
      saveLocal('wishlist', remItem)
    }

    setIsLiked(newIsLiked) // ← 여기서 state 업데이트

    if (onWishItem) {
      onWishItem(product.id, newIsLiked)
    }
  }

  const addToCart = () => {
    if (!useAuthStore.getState().user) {
      alert('로그인 후 장바구니를 이용해 주세요.')
      return
    }
    if (isSoldOut) return

    const cartItems = loadLocal('cart', [])
    const existingItem = cartItems.find((item) => item.id === product.id)
    const nextCart = existingItem
      ? cartItems.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock)) } : item)
      : [...cartItems, { ...product, quantity: 1 }]

    saveLocal('cart', nextCart)
  }

  return (
    <article className={styles.card}>
      <div className={styles.imageArea}>
        <Link to={`/products/${product.id}`}>
          <img src={product.image} alt={product.name} />
        </Link>
        <button
          type="button"
          className={styles.wishListButton}
          onClick={changeWishlist}
          aria-label={isLiked ? '찜 목록에서 제거' : '찜 목록에 추가'}
        >
          {isLiked ? '♥' : '♡'}
        </button>
        {isSoldOut && <span className={styles.soldOutBadge}>품절</span>}
        <div className={styles.productActions}>
          <Link to={`/products/${product.id}`} className={styles.detailButton}>상세보기</Link>
          <button type="button" className={styles.cartButton} onClick={addToCart} disabled={isSoldOut}>
            {isSoldOut ? '품절' : '장바구니 담기'}
          </button>
        </div>
      </div>

      <div className={styles.information}>
        <p className={styles.category}>{product.category}</p>
        <Link to={`/products/${product.id}`} className={styles.name}>
          {product.name}
        </Link>
        <div className={styles.priceArea}>
          {hasDiscount && <span className={styles.discountRate}>{product.discountRate}%</span>}
          <span className={styles.price}>{discountPrice.toLocaleString()}원</span>
          {hasDiscount && (
            <span className={styles.originalPrice}>{product.price.toLocaleString()}원</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
