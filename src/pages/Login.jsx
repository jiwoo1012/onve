import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import styles from './Login.module.scss'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((state) => state.login)
  const errorMessage = useAuthStore((state) => state.error)
  const isSubmitting = useAuthStore((state) => state.loading)
  const clearError = useAuthStore((state) => state.clearError)

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const isLoggedIn = await login(email, password)
    if (isLoggedIn) {
      const user = useAuthStore.getState().user
      const nickname = user?.nickname || user?.displayName || user?.email
      window.sessionStorage.setItem('toastMessage', `${nickname}님 반갑습니다`)
      navigate('/')
    }
  }

  return (
    <section className={styles.login}>
      <div className={styles.box}>
        <p className={styles.eyebrow}>READY TO GLOW AGAIN?</p>
        <h1>로그인</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="onve@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/find-password">비밀번호 찾기</Link>
          <span className={styles.divider}>|</span>
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </section>
  )
}

export default Login
