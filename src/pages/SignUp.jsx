import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import styles from './SignUp.module.scss'

const SignUp = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const signUp = useAuthStore((state) => state.signUp)
  const errorMessage = useAuthStore((state) => state.error)
  const isSubmitting = useAuthStore((state) => state.loading)
  const clearError = useAuthStore((state) => state.clearError)
  const setError = useAuthStore((state) => state.setError)

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    if (password !== passwordCheck) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    const isRegistered = await signUp(email, password, name)
    if (isRegistered) {
      navigate('/mypage')
    }
  }

  return (
    <section className={styles.signUp}>
      <div className={styles.box}>
        <p className={styles.eyebrow}>JOIN ONVE</p>
        <h1>회원가입</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
              placeholder="6자 이상 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="passwordCheck">비밀번호 확인</label>
            <input
              id="passwordCheck"
              type="password"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
            />
          </div>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className={styles.links}>
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </section>
  )
}

export default SignUp
