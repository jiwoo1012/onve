import {
  collection,
  getDocs,
  query,
  where,
  doc,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'
import { calculateEarnedPoints } from './pointsApi'

export const getUserOrders = async (uid) => {
  const ordersQuery = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
  )
  const orderSnapshot = await getDocs(ordersQuery)

  return orderSnapshot.docs
    .map((orderDocument) => ({
      id: orderDocument.id,
      ...orderDocument.data(),
    }))
    .sort((firstOrder, secondOrder) => {
      const firstCreatedAt = firstOrder.createAt?.toMillis?.() || firstOrder.createdAt?.toMillis?.() || 0
      const secondCreatedAt = secondOrder.createAt?.toMillis?.() || secondOrder.createdAt?.toMillis?.() || 0
      return secondCreatedAt - firstCreatedAt
    })
}

export const getAllOrders = async () => {
  const orderSnapshot = await getDocs(collection(db, 'orders'))

  return orderSnapshot.docs
    .map((orderDocument) => ({
      id: orderDocument.id,
      ...orderDocument.data(),
    }))
    .sort((firstOrder, secondOrder) => {
      const firstCreatedAt = firstOrder.createAt?.toMillis?.() || firstOrder.createdAt?.toMillis?.() || 0
      const secondCreatedAt = secondOrder.createAt?.toMillis?.() || secondOrder.createdAt?.toMillis?.() || 0
      return secondCreatedAt - firstCreatedAt
    })
}

// orderData 예: { productName, quantity, totalPrice, ... } — 프로젝트에서 쓰는 주문 필드 그대로 넣으면 됨
export const createOrder = async (uid, orderData) => {
  const earnedPoints = calculateEarnedPoints(orderData.totalPrice || orderData.totalAmount || 0)
  const orderRef = doc(collection(db, 'orders'))
  const userRef = doc(db, 'users', uid)

  await runTransaction(db, async (transaction) => {
    transaction.set(orderRef, {
      ...orderData,
      userId: uid,
      earnedPoints,
      createAt: serverTimestamp(),
    })

    transaction.update(userRef, {
      points: increment(earnedPoints),
    })
  })

  return { id: orderRef.id, earnedPoints }
}