import styles from './BrandMerit.module.scss'
 
const MERITS = [
  {
    title: '정교한 뷰티 테크놀로지',
    description: '피부 깊은 곳까지 정확하게 전달되는 고주파·초음파 기술',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="14" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <rect x="20" y="20" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M20 14V8M28 14V8M20 40V34M28 40V34M14 20H8M14 28H8M40 20H34M40 28H34"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: '검증된 안전성과 효과',
    description: '전문 임상 기관 테스트 완료 및 피부 자극 최소화 설계',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 8L38 13V22C38 31.4 32.2 38.6 24 41C15.8 38.6 10 31.4 10 22V13L24 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M18 24L22.5 28.5L31 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '직관적이고 편안한 케어',
    description: '원터치 조작과 인체공학적 그립감으로 매일 즐기는 홈케어',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 26V15.5C16 14.1 17.1 13 18.5 13C19.9 13 21 14.1 21 15.5V24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M21 24V13.5C21 12.1 22.1 11 23.5 11C24.9 11 26 12.1 26 13.5V24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M26 24V15.5C26 14.1 27.1 13 28.5 13C29.9 13 31 14.1 31 15.5V26"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 26V29C16 34 19.5 39 25 39C30 39 33 35 33 30V22.5C33 21.1 31.9 20 30.5 20C29.1 20 28 21.1 28 22.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: '일상에서 누리는 에스테틱',
    description: '샵에 가지 않고도 완성되는 내 손 안의 럭셔리 스킨케어',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 9L26.6 18.4L36 21L26.6 23.6L24 33L21.4 23.6L12 21L21.4 18.4L24 9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M36 8L37 11L40 12L37 13L36 16L35 13L32 12L35 11L36 8Z" fill="currentColor" />
      </svg>
    ),
  },
]
 
const BrandMerit = () => {
  return (
    <section className={styles.merit}>
      <div className={styles.glow} aria-hidden="true" />
 
      <div className={styles.inner}>
        <div className={styles.headRow}>
          <span className={styles.eyebrow}>ONVE MERIT</span>
          <h2 className={styles.headline}>
            정교한 기술로 다가가,
            <br />
            편안한 일상으로 완성하다
          </h2>
        </div>
 
        <ul className={styles.grid}>
          {MERITS.map((item) => (
            <li className={styles.column} key={item.title}>
              <span className={styles.iconWrap}>{item.icon}</span>
              <strong className={styles.title}>{item.title}</strong>
              <p className={styles.description}>{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
 
export default BrandMerit