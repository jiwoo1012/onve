import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Footer.module.scss'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <p className={styles.logo}>°onvé.</p>

          <nav className={styles.links}>
            <Link to="/notice">공지사항</Link>
            <Link to="/terms">이용약관</Link>
            <Link to="/privacy" className={styles.privacy}>개인정보처리방침</Link>
            <Link to="/faq">자주 묻는 질문</Link>
          </nav>
        </div>

        <div className={styles.bottom}>
          <div className={styles.info}>
            <p className={styles.disclaimer}>
              본 사이트는 실제 서비스가 아닌 포트폴리오 목적의 학습용 프로젝트입니다.
            </p>
            <p>onvé | 프론트엔드 개발 포트폴리오 | 제작자 김지우</p>
            <p>실제 상품 판매나 결제가 이루어지지 않으며, 모든 정보는 예시입니다.</p>
          </div>

          <div className={styles.sns}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>

        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} onvé. Student Portfolio Project.
        </p>
      </div>
    </footer>
  )
}

export default Footer