import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './EventBanner.module.scss'

const eventData = [
  {
    id: 1,
    image: '/img/banner/banner-28.png',
    eyebrow: 'ONVE SPECIAL',
    title: 'Summer Beauty Week',
    desc: '여름을 위한 ONVE 홈케어 디바이스를 특별한 혜택으로 만나보세요.',
    link: '/event/1',
  },
  {
    id: 2,
    image: '/img/banner/banner.png',
    eyebrow: 'NEW MEMBER',
    title: 'Welcome to ONVE',
    desc: '첫 만남을 위한 신규 회원 전용 혜택을 준비했어요.',
    link: '/event/2',
  },
  {
    id: 3,
    image: '/img/banner/banner1.png',
    eyebrow: 'LIMITED EVENT',
    title: 'Your Beauty Routine',
    desc: '나에게 맞는 뷰티 루틴을 찾고 특별한 혜택도 함께 받아보세요.',
    link: '/event/3',
  },
]

const EventBanner = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const total = eventData.length

  useEffect(() => {
    if (isPaused || total <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total)
    }, 4000)

    return () => clearInterval(timer)
  }, [isPaused, total])

  const getOffset = (index) => {
    let offset = index - activeIndex

    if (offset > total / 2) {
      offset -= total
    }

    if (offset < -total / 2) {
      offset += total
    }

    return offset
  }

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % total)
  }

  return (
    <section className={styles.eventSection}>
      <div className={styles.inner}>

        {/* =========================
            TITLE
        ========================= */}

        <div className={styles.heading}>
          

          <h2>ONVE EVENT</h2>

          
        </div>

        {/* =========================
            CAROUSEL
        ========================= */}

        <div
          className={styles.carousel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={styles.stage}>
            {eventData.map((event, index) => {
              const offset = getOffset(index)
              const isActive = offset === 0

              return (
                <div
                  key={event.id}
                  className={`${styles.slide} ${
                    isActive ? styles.activeSlide : ''
                  }`}
                  data-offset={offset}
                  onClick={() => {
                    if (!isActive) {
                      setActiveIndex(index)
                    }
                  }}
                >
                  <Link
                    to={event.link}
                    className={styles.eventCard}
                    onClick={(e) => {
                      if (!isActive) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      draggable="false"
                    />

                    <div className={styles.overlay} />

                    {isActive && (
                      <div className={styles.eventInfo}>
                        <span className={styles.eventEyebrow}>
                          {event.eyebrow}
                        </span>

                        <h3>{event.title}</h3>

                        <p>{event.desc}</p>

                        <span className={styles.viewMore}>
                          VIEW EVENT
                          <span>↗</span>
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* =========================
              ARROWS
          ========================= */}

          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={goPrev}
            aria-label="이전 이벤트"
          >
            ‹
          </button>

          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={goNext}
            aria-label="다음 이벤트"
          >
            ›
          </button>
        </div>

        {/* =========================
            PAGINATION
        ========================= */}

        <div className={styles.pagination}>
          <span>
            {String(activeIndex + 1).padStart(2, '0')}
          </span>

          <div className={styles.progress}>
            {eventData.map((event, index) => (
              <button
                key={event.id}
                type="button"
                className={
                  activeIndex === index
                    ? styles.progressActive
                    : ''
                }
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}번째 이벤트`}
              />
            ))}
          </div>

          <span>
            {String(total).padStart(2, '0')}
          </span>
        </div>

      </div>
    </section>
  )
}

export default EventBanner