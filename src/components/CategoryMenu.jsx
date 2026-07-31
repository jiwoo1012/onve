import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import styles from './CategoryMenu.module.scss'

const categoryData = [
  {
    slug: 'lifting',
    number: '01',
    image: '/img/category/lifting.png',
    nameKo: '리프팅 · 탄력',
    nameEn: 'LIFTING & FIRMING',
  },
  {
    slug: 'skincare',
    number: '02',
    image: '/img/category/skincare.png',
    nameKo: '스킨케어 · 흡수',
    nameEn: 'SKINCARE & BOOSTER',
  },
  {
    slug: 'cleansing',
    number: '03',
    image: '/img/category/cleansing.png',
    nameKo: '클렌징 · 모공',
    nameEn: 'CLEANSING & PORE',
  },
  {
    slug: 'led',
    number: '04',
    image: '/img/category/led.png',
    nameKo: 'LED 케어',
    nameEn: 'LED THERAPY',
  },
  {
    slug: 'body',
    number: '05',
    image: '/img/category/body.png',
    nameKo: '바디 · 제모',
    nameEn: 'BODY & HAIR REMOVAL',
  },
  {
    slug: 'hair',
    number: '06',
    image: '/img/category/hair.png',
    nameKo: '헤어 · 두피',
    nameEn: 'HAIR & SCALP',
  },
]

const CategoryMenu = () => {
  const [activeIndex, setActiveIndex] =
    useState(0)

  const total =
    categoryData.length

  const goPrev = () => {
    setActiveIndex(
      (prev) =>
        (prev - 1 + total) %
        total
    )
  }

  const goNext = () => {
    setActiveIndex(
      (prev) =>
        (prev + 1) %
        total
    )
  }

  const getOffset = (index) => {
    let offset =
      index - activeIndex

    if (
      offset >
      total / 2
    ) {
      offset -= total
    }

    if (
      offset <
      -total / 2
    ) {
      offset += total
    }

    return offset
  }

  const getCardStyle = (
    offset
  ) => {
    const abs =
      Math.abs(offset)

    // 중앙
    if (offset === 0) {
      return {
        transform: `
          translate3d(
            0px,
            0px,
            160px
          )
          rotateY(0deg)
          scale(1)
        `,

        opacity: 1,

        zIndex: 10,
      }
    }

    // 왼쪽 1
    if (offset === -1) {
      return {
        transform: `
          translate3d(
            -270px,
            10px,
            20px
          )
          rotateY(30deg)
          scale(0.88)
        `,

        opacity: 0.9,

        zIndex: 8,
      }
    }

    // 오른쪽 1
    if (offset === 1) {
      return {
        transform: `
          translate3d(
            270px,
            10px,
            20px
          )
          rotateY(-30deg)
          scale(0.88)
        `,

        opacity: 0.9,

        zIndex: 8,
      }
    }

    // 왼쪽 2
    if (offset === -2) {
      return {
        transform: `
          translate3d(
            -500px,
            25px,
            -150px
          )
          rotateY(60deg)
          scale(0.74)
        `,

        opacity: 0.7,

        zIndex: 5,
      }
    }

    // 오른쪽 2
    if (offset === 2) {
      return {
        transform: `
          translate3d(
            500px,
            25px,
            -150px
          )
          rotateY(-60deg)
          scale(0.74)
        `,

        opacity: 0.7,

        zIndex: 5,
      }
    }

    if (abs === 3) {
      return {
        transform: `
          translate3d(
            ${
              offset > 0
                ? 650
                : -650
            }px,
            40px,
            -260px
          )
          rotateY(
            ${
              offset > 0
                ? -72
                : 72
            }deg
          )
          scale(0.65)
        `,

        opacity: 0.4,

        zIndex: 2,
      }
    }

    return {
      opacity: 0,

      pointerEvents: 'none',
    }
  }


  return (
    <section
      className={
        styles.categorySection
      }
    >

      {/* HEADER */}

      <div
        data-category-header

        className={
          styles.categoryHeader
        }
      >

        <h2>
          Find Your Beauty Device
        </h2>
      </div>


      {/* CAROUSEL */}

      <div
        data-category-carousel

        className={
          styles.carousel
        }
      >

        <button
          type="button"

          className={`
            ${styles.arrow}
            ${styles.arrowLeft}
          `}

          onClick={goPrev}

          aria-label="이전 카테고리"
        >
          ←
        </button>


        <div
          className={
            styles.stage
          }
        >

          <div
            className={
              styles.track
            }
          >

            {categoryData.map(
              (
                item,
                index
              ) => {
                const offset =
                  getOffset(
                    index
                  )

                const isActive =
                  offset === 0

                const cardStyle =
                  getCardStyle(
                    offset
                  )

                return (
                  <Link
                    key={
                      item.slug
                    }

                    to={
                      `/products/category/${item.slug}`
                    }

                    className={`
                      ${styles.card}

                      ${
                        isActive
                          ? styles.cardActive
                          : ''
                      }
                    `}

                    style={
                      cardStyle
                    }

                    onClick={
                      (e) => {
                        if (
                          !isActive
                        ) {
                          e.preventDefault()

                          setActiveIndex(
                            index
                          )
                        }
                      }
                    }
                  >
                    <div
                      className={
                        styles.cardImage
                      }
                    >
                      <img
                        src={
                          item.image
                        }

                        alt={
                          item.nameKo
                        }
                      />

                      {!isActive && (
                        <div
                          className={
                            styles.cardShade
                          }
                        />
                      )}
                    </div>


                    {isActive && (
                      <div
                        className={
                          styles.cardInfo
                        }
                      >
                        <span>
                          {
                            item.number
                          }
                        </span>

                        <h3>
                          {
                            item.nameKo
                          }
                        </h3>

                        <p>
                          {
                            item.nameEn
                          }
                        </p>
                      </div>
                    )}

                  </Link>
                )
              }
            )}

          </div>

        </div>


        <button
          type="button"

          className={`
            ${styles.arrow}
            ${styles.arrowRight}
          `}

          onClick={goNext}

          aria-label="다음 카테고리"
        >
          →
        </button>

      </div>


      {/* DOTS */}

      <div
        data-category-dots

        className={
          styles.dots
        }
      >
        {categoryData.map(
          (
            item,
            index
          ) => (
            <button
              key={
                item.slug
              }

              type="button"

              className={`
                ${styles.dot}

                ${
                  index ===
                  activeIndex
                    ? styles.dotActive
                    : ''
                }
              `}

              onClick={() =>
                setActiveIndex(
                  index
                )
              }

              aria-label={
                `${item.nameKo}로 이동`
              }
            />
          )
        )}
      </div>

    </section>
  )
}

export default CategoryMenu