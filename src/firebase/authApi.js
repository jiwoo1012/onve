import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

// 실행 중인 개발 서버의 이전 모듈도 안전하게 갱신되도록 유지합니다.
export const signIn = login

export const signUp = async (email, password, nickname) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: nickname })
  return credential.user
}

export const signOutUser = () => signOut(auth)

export const subscribeToAuthState = (callback) =>
  onAuthStateChanged(auth, callback)
