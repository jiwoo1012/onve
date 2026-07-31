import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './BestItems.module.scss'

const BestItems = ({ products = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  // 왼쪽 메인 비주얼은 최대 3개
  const heroProducts = products.slice(0, 3)

  useEffect(() => {
    if (heroProducts.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) =>
        (prev + 1) % heroProducts.length
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [heroProducts.length])

  const goPrev = () => {
    setActiveIndex((prev) =>
      prev === 0
        ? heroProducts.length - 1
        : prev - 1
    )
  }

  const goNext = () => {
    setActiveIndex((prev) =>
      (prev + 1) % heroProducts.length
    )
  }

  const formatPrice = (price) => {
    if (!price) return ''
    return Number(price).toLocaleString('ko-KR')
  }

  if (!products.length) return null

  return (
    <section className={styles.bestItems}>
      <div className={styles.inner}>

        {/* =========================
            TITLE
        ========================= */}

        <div className={styles.heading}>
          

          <h2>
            Most Loved by ONVE
          </h2>

          <Link
            to="/products"
            className={styles.viewAll}
          >
            전체보기
            <span>↗</span>
          </Link>
        </div>


        {/* =========================
            CONTENT
        ========================= */}

        <div className={styles.contents}>

          {/* =====================
              LEFT HERO
          ===================== */}

          <div className={styles.hero}>

            <div className={styles.heroSlides}>
              {heroProducts.map((product, index) => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className={`${styles.heroSlide} ${
                    activeIndex === index
                      ? styles.heroSlideActive
                      : ''
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <div className={styles.heroOverlay} />

                  <div className={styles.heroInfo}>
                    <span className={styles.pickNumber}>
                      BEST {String(index + 1).padStart(2, '0')}.
                    </span>

                    <span className={styles.heroCategory}>
                      {product.category}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <div className={styles.heroPrice}>
                      {product.discountRate > 0 && (
                        <strong>
                          {product.discountRate}%
                        </strong>
                      )}

                      <span>
                        {formatPrice(product.price)}원
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>


            {/* arrows */}

            {heroProducts.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.heroArrow} ${styles.heroPrev}`}
                  onClick={goPrev}
                  aria-label="이전 베스트 상품"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className={`${styles.heroArrow} ${styles.heroNext}`}
                  onClick={goNext}
                  aria-label="다음 베스트 상품"
                >
                  ›
                </button>
              </>
            )}


            {/* pagination */}

            <div className={styles.heroPagination}>
              <span>
                {String(activeIndex + 1).padStart(2, '0')}
              </span>

              <div className={styles.heroProgress}>
                {heroProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={
                      activeIndex === index
                        ? styles.progressActive
                        : ''
                    }
                    onClick={() => setActiveIndex(index)}
                    aria-label={`${index + 1}번째 상품`}
                  />
                ))}
              </div>

              <span>
                {String(heroProducts.length).padStart(2, '0')}
              </span>
            </div>

          </div>


          {/* =====================
              RIGHT PRODUCT GRID
          ===================== */}

          <div className={styles.productGrid}>
            {products.slice(0, 4).map((product, index) => (
              <Link
                to={`/products/${product.id}`}
                key={product.id}
                className={styles.productCard}
              >

                <div className={styles.productImage}>
                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <div className={styles.hoverLayer}>
                    <span>
                      VIEW PRODUCT
                    </span>

                    <span className={styles.hoverArrow}>
                      ↗
                    </span>
                  </div>
                </div>


                <div className={styles.productInfo}>
                  <span className={styles.category}>
                    {product.category}
                  </span>

                  <h3>
                    {product.name}
                  </h3>

                  <div className={styles.priceArea}>
                    {product.discountRate > 0 && (
                      <strong>
                        {product.discountRate}%
                      </strong>
                    )}

                    <span>
                      {formatPrice(product.price)}원
                    </span>
                  </div>
                </div>

              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

export default BestItems