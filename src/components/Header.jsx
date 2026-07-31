import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import SearchBox from './SearchBox'
import styles from './Header.module.scss'

const Header = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const logout = useAuthStore((state) => state.logout)

  console.log('user:', user)

  const handleLogout = async () => {
    try {
      const isLoggedOut = await logout()
      if (!isLoggedOut) return
      navigate('/')
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다.', error)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link to="/" className={styles.logo}>
          <img src="/img/logo-05.png" alt="로고" />
        </Link>

        <div className={styles.searchArea}>
          <SearchBox />
        </div>

        <nav className={styles.userNav}>
          {user ? (
            <>
              <Link to="/mypage" className={styles.greeting}>
                {profile?.nickname || user.displayName || user.email} 님
              </Link>
              <button type="button" onClick={handleLogout} aria-label="로그아웃">
                <img src="/img/headerIcon-48.png" alt="로그아웃" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"><img src="/img/headerIcon_Black-01.png" alt="로그인" /></Link>
              <Link to="/signup"><img src="/img/headerIcon_Black-02.png" alt="회원가입" /></Link>
            </>
          )}
          <Link to="/wishlist"><img src="/img/headerIcon_Black-03.png" alt="위시리스트" /></Link>
          <Link to="/cart"><img src="/img/headerIcon_Black-04.png" alt="장바구니" /></Link>
        </nav>
      </div>

      <nav className={styles.categoryNav}>
        <Link to="/products">전체 상품</Link>
        <Link to="/products/category/LIFTING">리프팅 기기</Link>
        <Link to="/products/category/SKINCARE">스킨케어</Link>
        <Link to="/products/category/CLEANSING">클렌징</Link>
        <Link to="/products/category/LED">LED 케어</Link>
        <Link to="/products/category/BODY">바디 케어</Link>
        <Link to="/products/category/HAIR">헤어 케어</Link>
        <Link to="/notice">NOTICE</Link>
        {profile?.role === 'admin' && <Link to="/admin">관리자</Link>}
        {/* <Link to="/search/:keyword" className={styles.searchIcon}>
          검색
        </Link> */}
      </nav>
    </header>
  )
}

export default Header