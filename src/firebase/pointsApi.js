import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ---------- 포인트 ----------

export const getUserPoints = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return 0
  return snap.data().points || 0
}

// amount: 양수면 적립, 음수면 사용/차감
export const addUserPoints = async (uid, amount) => {
  await updateDoc(doc(db, 'users', uid), {
    points: increment(amount),
  })
}

// 주문 금액 기준 적립 포인트 계산 (예: 5% 적립, 필요에 맞게 비율 조정)
export const calculateEarnedPoints = (orderTotal, rate = 0.05) => {
  return Math.floor(orderTotal * rate)
}

// ---------- 쿠폰 ----------

export const getUserCoupons = async (uid) => {
  const snap = await getDocs(collection(db, 'users', uid, 'coupons'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const issueCoupon = async (uid, coupon) => {
  // coupon: { name, discountType: 'percent' | 'amount', discountValue, expiresAt }
  await addDoc(collection(db, 'users', uid, 'coupons'), {
    ...coupon,
    isUsed: false,
    issuedAt: serverTimestamp(),
  })
}

export const useCoupon = async (uid, couponId) => {
  await updateDoc(doc(db, 'users', uid, 'coupons', couponId), {
    isUsed: true,
    usedAt: serverTimestamp(),
  })
}