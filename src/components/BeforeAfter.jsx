import React, { useState } from 'react'
import styles from './BeforeAfter.module.scss'

const BeforeAfter = () => {
  const [position, setPosition] = useState(50)

  return (
    <section className={styles.beforeAfter}>
      <div className={styles.inner}>

        {/* =========================
            TITLE
        ========================= */}
        <div className={styles.heading}>
          <h2>
            BEFORE & AFTER
          </h2>

          <p className={styles.deviceName}>
            HIFU Lifting Device
          </p>

          <p className={styles.description}>
            ONVE로 경험하는 눈에 보이는 변화를 직접 확인해보세요.
          </p>
        </div>

        {/* =========================
            COMPARE IMAGE
        ========================= */}
        <div className={styles.compareWrap}>

          <div className={styles.compareStage}>

            {/* BEFORE */}
            <img
              src="/img/beforeafter/after.png"
              alt="HIFU 리프팅 디바이스 사용 전"
              className={styles.beforeImage}
              draggable="false"
            />

            {/* AFTER */}
            <img
              src="/img/beforeafter/before.png"
              alt="HIFU 리프팅 디바이스 사용 후"
              className={styles.afterImage}
              draggable="false"
              style={{
                clipPath: `inset(0 0 0 ${position}%)`,
              }}
            />

            {/* BEFORE / AFTER LABEL */}
            <span
              className={`${styles.label} ${styles.beforeLabel}`}
            >
              BEFORE
            </span>

            <span
              className={`${styles.label} ${styles.afterLabel}`}
            >
              AFTER
            </span>

            {/* DIVIDER */}
            <div
              className={styles.divider}
              style={{
                left: `${position}%`,
              }}
            >
              <span className={styles.dividerLine} />

              <span className={styles.handle}>
                <span>‹</span>
                <span>›</span>
              </span>
            </div>

            {/* 실제 드래그 영역 */}
            <input
              type="range"
              min="0"
              max="100"
              value={position}
              onChange={(e) =>
                setPosition(Number(e.target.value))
              }
              className={styles.range}
              aria-label="사용 전후 이미지 비교"
            />

          </div>

          {/* 하단 설명 */}
          <div className={styles.compareInfo}>
            

            <p className={styles.dragGuide}>
              마우스로 드래그해보세요.
            </p>

            
          </div>

        </div>

      </div>
    </section>
  )
}

export default BeforeAfter