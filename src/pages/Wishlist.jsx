import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyMessage from '../components/EmptyMessage'
import WishCard from '../components/WishCard'
import { loadLocal, saveLocal } from '../utils/localStorage'
import styles from './Wishlist.module.scss'
import useAuthStore from '../store/authStore'

const ITEMS_PER_PAGE = 8

const Wishlist = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [wishItem, setWishItem] = useState(() => loadLocal('wishlist', []))
  const [removingId, setRemovingId] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartModalProduct, setCartModalProduct] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    saveLocal('wishlist', wishItem)
  }, [wishItem])

  const handleRemove = (productId) => {
    if (removingId !== null) return
    setRemovingId(productId)
    setTimeout(() => {
      setWishItem((prev) => prev.filter((item) => item.id !== productId))
      setRemovingId(null)
    }, 500)
  }

  const categoryChips = useMemo(() => {
    const counts = wishItem.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }, [wishItem])

  const displayedWish =
    activeCategory === 'all'
      ? wishItem
      : wishItem.filter((item) => item.category === activeCategory)

  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (activeCategory === 'all') return
    const categoryExists = wishItem.some((item) => item.category === activeCategory)
    if (!categoryExists) {
      setActiveCategory('all')
      setCurrentPage(1)
    }
  }, [wishItem, activeCategory])

  const totalPages = Math.max(1, Math.ceil(displayedWish.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const pagedWish = displayedWish.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1))
  const goNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1))

  const closeCartModal = () => setCartModalProduct(null)
  const goToCart = () => {
    setCartModalProduct(null)
    navigate('/cart')
  }

  if (!user) {
    return (
      <section className={styles.wishlist}>
        <EmptyMessage
          image="/img/headerIcon_Black-03.png"
          title="로그인이 필요한 서비스입니다."
          desc="찜 목록은 로그인 후 이용하실 수 있어요."
          link="/login"
          linkText="로그인하러 가기"
        />
      </section>
    )
  }

  return (
    <section className={styles.wishlist}>
      {/* ================================
          HEADER
      ================================= */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>WISHLIST</p>
        <h2>찜 목록</h2>
        <span className={styles.count}>관심 목록 {wishItem.length}개</span>
      </div>

      {/* ================================
          EMPTY
      ================================= */}
      {wishItem.length === 0 ? (
        <EmptyMessage
          image="/img/headerIcon_Black-03.png"
          title="찜한 상품이 없습니다."
          desc="관심있는 상품을 찜해주세요."
          link="/products"
          linkText="찜하러가기"
        />
      ) : (
        <>
          {/* ============================
              FILTER
          ============================= */}
          <div className={styles.chipRow}>
            <button
              type="button"
              className={`${styles.chip} ${activeCategory === 'all' ? styles.chipActive : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              전체
              <span className={styles.chipCount}>{wishItem.length}</span>
            </button>

            {categoryChips.map(({ category, count }) => (
              <button
                key={category}
                type="button"
                className={`${styles.chip} ${activeCategory === category ? styles.chipActive : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
                <span className={styles.chipCount}>{count}</span>
              </button>
            ))}
          </div>

          {/* ============================
              PRODUCTS
          ============================= */}
          {displayedWish.length === 0 ? (
            <p className={styles.filterEmpty}>해당 카테고리에 찜한 상품이 없습니다.</p>
          ) : (
            <>
              <div className={styles.productGrid}>
                {pagedWish.map((item) => {
                  const isRemoving = removingId === item.id

                  return (
                    <div
                      key={item.id}
                      className={`${styles.cardSlot} ${isRemoving ? styles.cardRemoving : ''}`}
                    >
                      {/* 클릭 직후 피드백 */}
                      {isRemoving && (
                        <div className={styles.removeFeedback}>
                          <span>♥</span>
                          <p>찜에서 삭제했어요</p>
                        </div>
                      )}

                      <WishCard
                        product={item}
                        isRemoving={isRemoving}
                        onRemove={handleRemove}
                        onAddToCart={setCartModalProduct}
                      />
                    </div>
                  )
                })}
              </div>

              {/* ========================
                  PAGINATION
              ======================== */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={goPrevPage}
                    disabled={currentPage === 1}
                    aria-label="이전 페이지"
                  >
                    &lt;
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={goNextPage}
                    disabled={currentPage === totalPages}
                    aria-label="다음 페이지"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ================================
          CART MODAL
      ================================= */}
      {cartModalProduct && (
        <div className={styles.modalOverlay} onClick={closeCartModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={closeCartModal}
              aria-label="닫기"
            >
              ✕
            </button>

            <div className={styles.modalContent}>
              <div className={styles.modalImage}>
                <img src={cartModalProduct.image} alt={cartModalProduct.name} />
              </div>

              <p className={styles.modalMessage}>장바구니에 담았습니다.</p>
              <p className={styles.modalProductName}>{cartModalProduct.name}</p>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalContinue} onClick={closeCartModal}>
                계속 쇼핑하기
              </button>
              <button type="button" className={styles.modalGoCart} onClick={goToCart}>
                장바구니로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Wishlist
