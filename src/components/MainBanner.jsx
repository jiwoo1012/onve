import React, {
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import styles from './MainBanner.module.scss'

gsap.registerPlugin(ScrollTrigger)

const bannerData = [
  {
    title: 'Lifting Routine',
    image: '/img/main/bannerImg01.png',
    thumb: '/img/main/bannerImg01.png',
    collection: 'LIFTING CARE',
    name: 'ONVE Select 01',
  },
  {
    title: 'Skincare Routine',
    image: '/img/main/bannerImg02.png',
    thumb: '/img/main/bannerImg02.png',
    collection: 'SKINCARE CARE',
    name: 'ONVE Select 02',
  },
  {
    title: 'Cleansing Routine',
    image: '/img/main/bannerImg03.png',
    thumb: '/img/main/bannerImg03.png',
    collection: 'CLEANSING CARE',
    name: 'ONVE Select 03',
  },
]

const clamp = (value) => {
  return Math.min(Math.max(value, 0), 1)
}

const MainBanner = ({ children }) => {
  const sectionRef = useRef(null)

  const finalImageRef = useRef(null)

  const titleTrackRef = useRef(null)
  const thumbnailRefs = useRef([])

  const leftTextRef = useRef(null)
  const rightTextRef = useRef(null)

  const categoryOverlayRef = useRef(null)

  const [activeIndex, setActiveIndex] =
    useState(0)

  const [isTransition, setIsTransition] =
    useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const overlay =
        categoryOverlayRef.current

      if (!overlay) return

      // CategoryMenu 내부 요소
      const categoryHeader =
        overlay.querySelector(
          '[data-category-header]'
        )

      const categoryCarousel =
        overlay.querySelector(
          '[data-category-carousel]'
        )

      const categoryDots =
        overlay.querySelector(
          '[data-category-dots]'
        )

      // ========================================
      // CATEGORY 초기화
      // ========================================

      const resetOverlay = () => {
        gsap.set(overlay, {
          yPercent: 100,

          borderTopLeftRadius: '80px',
          borderTopRightRadius: '80px',

          pointerEvents: 'none',
        })

        // 제목은 처음엔 안 보임
        if (categoryHeader) {
          gsap.set(categoryHeader, {
            opacity: 0,
            y: 80,
          })
        }

        // 카드도 처음엔 안 보임
        if (categoryCarousel) {
          gsap.set(categoryCarousel, {
            opacity: 0,
            y: 90,
          })
        }

        // dots
        if (categoryDots) {
          gsap.set(categoryDots, {
            opacity: 0,
            y: 20,
          })
        }
      }

      resetOverlay()

      // ========================================
      // 마지막 이미지 축소
      // ========================================

      const setFinalTransition = (p) => {
        if (!finalImageRef.current) return

        const scaleX =
          1 - p * 0.96

        const scaleY =
          1 - p * 0.94

        gsap.set(
          finalImageRef.current,
          {
            scaleX,
            scaleY,

            transformOrigin:
              'center center',

            opacity:
              p > 0.92
                ? 1 -
                  (p - 0.92) / 0.08
                : 1,
          }
        )

        // ====================================
        // See closer / Feel better
        // ====================================

        const currentImageWidth =
          100 - p * 96

        const textShowWidth = 55

        let textProgress = 0

        if (
          currentImageWidth <=
          textShowWidth
        ) {
          textProgress =
            Math.min(
              (
                textShowWidth -
                currentImageWidth
              ) / 20,
              1
            )
        }

        const distance =
          360 -
          textProgress * 290

        gsap.set(
          leftTextRef.current,
          {
            opacity: textProgress,

            xPercent: -100,
            yPercent: -50,

            x: -distance,
          }
        )

        gsap.set(
          rightTextRef.current,
          {
            opacity: textProgress,

            xPercent: 100,
            yPercent: -50,

            x: distance,
          }
        )
      }

      // ========================================
      // SCROLL
      // ========================================

      ScrollTrigger.create({
        trigger: sectionRef.current,

        start: 'top top',

        end: '+=7600',

        pin: true,

        scrub: true,

        anticipatePin: 1,

        invalidateOnRefresh: true,

        onUpdate: (self) => {
          const progress =
            self.progress

          /*
            0.00 ~ 0.50
            기존 배너 전환

            0.50 ~ 0.72
            마지막 이미지 축소

            0.72 ~ 0.76
            See closer / Feel better 유지

            0.76 ~ 1.00
            카테고리 판이 아래에서 올라옴
          */


          // ====================================
          // 1. 기존 배너
          // ====================================

          if (progress <= 0.5) {
  setIsTransition(false)

  const bannerProgress = progress / 0.5
  const rawIndex = clamp(bannerProgress) * (bannerData.length - 1) // 연속값

  const nextIndex = Math.min(
    Math.round(rawIndex),
    bannerData.length - 1
  )
  setActiveIndex(nextIndex)

  // 제목 트랙: 연속값으로 매 프레임 직접 이동
  if (titleTrackRef.current) {
    gsap.set(titleTrackRef.current, { y: -rawIndex * 110 })
  }

  // 썸네일: 각 항목이 rawIndex 기준 상대 위치로 이동
  thumbnailRefs.current.forEach((el, index) => {
    if (!el) return
    gsap.set(el, {
      y: (index - rawIndex) * 150,
      opacity: Math.abs(index - rawIndex) < 0.5 ? 1 : 0.55,
    })
  })

  if (finalImageRef.current) {
    gsap.set(finalImageRef.current, { clearProps: 'transform,opacity' })
  }

  if (leftTextRef.current) {
    gsap.set(leftTextRef.current, { clearProps: 'transform,opacity' })
  }

  if (rightTextRef.current) {
    gsap.set(rightTextRef.current, { clearProps: 'transform,opacity' })
  }

  resetOverlay()

  return
}


          // ====================================
          // 2. 마지막 배너 축소
          // ====================================

          setActiveIndex(2)

          setIsTransition(true)

          const transitionProgress =
            clamp(
              (
                progress -
                0.5
              ) /
                (
                  0.72 -
                  0.5
                )
            )

          setFinalTransition(
            transitionProgress
          )


          // ====================================
          // 3. 잠시 마지막 화면 유지
          // ====================================

          if (progress < 0.76) {
            resetOverlay()

            return
          }


          // ====================================
          // 4. CATEGORY 판 올라오기
          // ====================================

          const overlayProgress =
            clamp(
              (
                progress -
                0.76
              ) /
                (
                  1 -
                  0.76
                )
            )

          const translateY =
            100 -
            overlayProgress * 100

          const radius =
            80 *
            (
              1 -
              overlayProgress
            )

          gsap.set(overlay, {
            yPercent:
              translateY,

            borderTopLeftRadius:
              `${radius}px`,

            borderTopRightRadius:
              `${radius}px`,

            pointerEvents:
              overlayProgress >
              0.92
                ? 'auto'
                : 'none',
          })


          // ====================================
          // 5. CATEGORY 제목 등장
          //
          // 판이 55% 이상 올라온 후부터 시작
          // 아래 → 위
          // ====================================

          const headerProgress =
            clamp(
              (
                overlayProgress -
                0.55
              ) /
                0.2
            )

          if (categoryHeader) {
            gsap.set(
              categoryHeader,
              {
                opacity:
                  headerProgress,

                y:
                  80 *
                  (
                    1 -
                    headerProgress
                  ),
              }
            )
          }


          // ====================================
          // 6. CARD 등장
          //
          // 제목보다 조금 늦게
          // ====================================

          const carouselProgress =
            clamp(
              (
                overlayProgress -
                0.67
              ) /
                0.2
            )

          if (categoryCarousel) {
            gsap.set(
              categoryCarousel,
              {
                opacity:
                  carouselProgress,

                y:
                  90 *
                  (
                    1 -
                    carouselProgress
                  ),
              }
            )
          }


          // ====================================
          // 7. DOTS 등장
          // ====================================

          const dotsProgress =
            clamp(
              (
                overlayProgress -
                0.8
              ) /
                0.15
            )

          if (categoryDots) {
            gsap.set(
              categoryDots,
              {
                opacity:
                  dotsProgress,

                y:
                  20 *
                  (
                    1 -
                    dotsProgress
                  ),
              }
            )
          }
        },
      })
    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [])


  return (
    <section
      ref={sectionRef}
      className={styles.banner}
    >

      {/* =============================
          BACKGROUND
      ============================= */}

      <div
        className={
          styles.backgrounds
        }
      >
        {bannerData.map(
          (item, index) => (
            <div
              key={item.title}

              ref={
                index === 2
                  ? finalImageRef
                  : null
              }

              className={`
                ${styles.background}

                ${
                  activeIndex ===
                  index
                    ? styles.activeBackground
                    : ''
                }
              `}
            >
              <img
                src={item.image}
                alt={item.title}
              />
            </div>
          )
        )}
      </div>


      {/* =============================
          기존 Telescope UI
      ============================= */}

      {!isTransition && (
        <>
          <div
            className={
              styles.guide
            }
          >
            <span
              className={
                styles.guideLabel
              }
            >
              Discover
            </span>

            <span
              className={
                styles.pivot
              }
            />

            <span
              className={
                styles.lineTop
              }
            />

            <span
              className={
                styles.lineBottom
              }
            />
          </div>


          <div className={styles.titleArea}>
  <div ref={titleTrackRef} className={styles.titleTrack}>
    {bannerData.map((item, index) => (
      <div
        key={item.title}
        className={`
          ${styles.titleItem}
          ${activeIndex === index ? styles.activeTitle : ''}
        `}
      >
        {item.title}
      </div>
    ))}
  </div>
</div>


          <div className={styles.thumbnailArea}>
  {bannerData.map((item, index) => (
    <div
      key={item.title}
      ref={(el) => (thumbnailRefs.current[index] = el)}
      className={styles.thumbnail}
    >
      <img src={item.thumb} alt="" />
    </div>
  ))}
</div>


          <div
            className={
              styles.collectionBox
            }
          >
            <div
              className={
                styles.collectionCircle
              }
            />

            <div>
              <span>
                COLLECTION
              </span>

              <strong>
                {
                  bannerData[
                    activeIndex
                  ].collection
                }
              </strong>

              <p>
                {
                  bannerData[
                    activeIndex
                  ].name
                }
              </p>
            </div>
          </div>
        </>
      )}


      {/* =============================
          FINAL TEXT
      ============================= */}

      <h2
        ref={leftTextRef}

        className={
          styles.transitionLeft
        }
      >
        See closer
      </h2>


      <h2
        ref={rightTextRef}

        className={
          styles.transitionRight
        }
      >
        Feel better
      </h2>


      {/* =============================
          BOTTOM BAR
      ============================= */}

      <div
        className={
          styles.bottomBar
        }
      >
        <strong>
          ONVE
        </strong>

        <span>
          YOUR BEAUTY.
          <br />
          YOUR ROUTINE.
        </span>

        <button type="button">
          SHOP NOW
        </button>
      </div>


      {/* =============================
          CATEGORY OVERLAY
      ============================= */}

      <div
        ref={
          categoryOverlayRef
        }

        className={
          styles.categoryOverlay
        }
      >
        {children}
      </div>

    </section>
  )
}

export default MainBanner