import React, { useEffect, useState } from 'react'
import styles from './BestReview.module.scss'

const reviewData = [
  {
    id: 1,
    image: '/img/review/review.png',
    productName: 'ONVE HIFU 리프팅 디바이스',
    rating: 5,
    review:
      '피부과 레이저 비용 생각하면 완전 가성비 대박이에요! 집에서 턱선이랑 볼 라인 정리할 때 손이 정말 자주 가네요.',
    user: '김**',
  },
  {
    id: 2,
    image: '/img/review/review02.png',
    productName: 'ONVE 듀얼 케어 디바이스',
    rating: 5,
    review:
      '처음에는 홈케어 기기가 낯설었는데 생각보다 사용법이 간단해요. 특히 관리하고 다음 날 피부 컨디션이 마음에 들어요.',
    user: '이**',
  },
  {
    id: 3,
    image: '/img/review/review03.png',
    productName: 'onve 음이온 헤어 스트레이트너 (고데기)',
    rating:5,
    review:
      '음이온 기능 덕분인지 확실히 정전기나 머릿결 손상이 적고, 한 번만 쓸어내려도 부스스했던 머리가 윤기 있게 쫙 펴져요!',
    user: '박**',
  },
  {
    id: 4,
    image: '/img/review/review04.png',
    productName: 'onve 가정용 IPL 빛조사 셀프 제모기',
    rating: 5,
    review:
      '피부과 예약하고 가기 귀찮아서 샀는데 기대 이상이에요! 자극도 거의 없고 몇 번 쓰니 털 자라는 속도가 확실히 느려졌어요.',
    user: '최**',
  },
]

const BestReview = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const activeReview = reviewData[activeIndex]

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setActiveIndex((prev) =>
        (prev + 1) % reviewData.length
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section className={styles.bestReview}>
      <div className={styles.inner}>

        {/* =========================
            TITLE
        ========================= */}

        <div className={styles.heading}>
          

          <h2>BEST REVIEW</h2>

          
        </div>


        {/* =========================
            REVIEW CONTENT
        ========================= */}

        <div
          className={styles.reviewArea}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* =====================
              LEFT IMAGE
          ===================== */}

          <div className={styles.imageArea}>
            {reviewData.map((review, index) => (
              <img
                key={review.id}
                src={review.image}
                alt={review.productName}
                className={`${styles.reviewImage} ${
                  activeIndex === index
                    ? styles.reviewImageActive
                    : ''
                }`}
              />
            ))}

            <div className={styles.imageNumber}>
              <span>
                {String(activeIndex + 1).padStart(2, '0')}
              </span>

              <span className={styles.numberLine} />

              <span>
                {String(reviewData.length).padStart(2, '0')}
              </span>
            </div>
          </div>


          {/* =====================
              RIGHT CONTENT
          ===================== */}

          <div className={styles.reviewContent}>

            {/* NUMBER TAB */}

            <div className={styles.tabs}>
              {reviewData.map((review, index) => (
                <button
                  key={review.id}
                  type="button"
                  className={`${styles.tab} ${
                    activeIndex === index
                      ? styles.tabActive
                      : ''
                  }`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${index + 1}번째 리뷰`}
                >
                  {index + 1}
                </button>
              ))}
            </div>


            {/* PRODUCT NAME */}

            <div
              key={`product-${activeReview.id}`}
              className={styles.productBox}
            >
              <span>PRODUCT</span>

              <h3>
                {activeReview.productName}
              </h3>
            </div>


            {/* REVIEW */}

            <div
              key={`review-${activeReview.id}`}
              className={styles.reviewBox}
            >
              <div className={styles.stars}>
                {Array.from(
                  { length: activeReview.rating },
                  (_, index) => (
                    <span key={index}>★</span>
                  )
                )}
              </div>

              <p>
                “{activeReview.review}”
              </p>

              <div className={styles.reviewer}>
                <span>BEST REVIEW</span>
                <strong>{activeReview.user} 님</strong>
              </div>
            </div>


            {/* AUTO PROGRESS */}

            <div className={styles.autoProgress}>
              <span
                key={activeIndex}
                className={
                  isPaused
                    ? styles.progressPaused
                    : styles.progressBar
                }
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default BestReview