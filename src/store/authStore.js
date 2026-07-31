import { useSyncExternalStore } from 'react'
import { createStore } from 'zustand/vanilla'
import { login as loginWithEmail, signOutUser, signUp, subscribeToAuthState } from '../firebase/authApi'
import { createUserProfile, getUser } from '../firebase/userApi'

let authUnsubscribe = null

const getKoreanErrorMessage = (error, defaultMessage) => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return '이메일 또는 비밀번호가 일치하지 않습니다.'
    case 'auth/user-not-found':
      return '가입되지 않은 이메일입니다.'
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다.'
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다.'
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.'
    default:
      return defaultMessage
  }
}

const authStore = createStore((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: '',

  initializeAuth: () => {
    if (authUnsubscribe) return

    authUnsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        set({ user: null, profile: null, loading: false })
        return
      }

      try {
        const profile = await getUser(user.uid)
        set({ user, profile, loading: false })
      } catch (error) {
        console.error(error)
        set({ user, profile: null, loading: false })
      }
    })
  },

  clearError: () => set({ error: '' }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    if (!email || !password) {
      set({ error: '이메일과 비밀번호를 모두 입력해주세요.' })
      return false
    }

    set({ loading: true, error: '' })
    try {
      const { user } = await loginWithEmail(email, password)
      const profile = await getUser(user.uid)
      set({ user, profile })
      return true
    } catch (error) {
      console.error(error)
      set({ error: getKoreanErrorMessage(error, '로그인 중 오류가 발생했습니다. 다시 시도해주세요.') })
      return false
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email, password, nickname) => {
    if (!email || !password || !nickname) {
      set({ error: '모든 항목을 입력해주세요.' })
      return false
    }
    if (password.length < 6) {
      set({ error: '비밀번호는 6자 이상이어야 합니다.' })
      return false
    }

    set({ loading: true, error: '' })
    try {
      const user = await signUp(email, password, nickname)
      const profile = await createUserProfile(user, nickname)
      set({ user, profile })
      return true
    } catch (error) {
      console.error(error)
      set({ error: getKoreanErrorMessage(error, '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.') })
      return false
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    try {
      await signOutUser()
      // 로그아웃 시 이전 사용자의 장바구니/찜 데이터 제거
      localStorage.removeItem('cart')
      localStorage.removeItem('wishlist')
      set({ user: null, profile: null })
      return true
    } catch (error) {
      console.error(error)
      set({ error: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.' })
      return false
    }
  },
}))

const useAuthStore = (selector) =>
  useSyncExternalStore(
    authStore.subscribe,
    () => selector(authStore.getState()),
    () => selector(authStore.getInitialState()),
  )

Object.assign(useAuthStore, authStore)

export default useAuthStore
