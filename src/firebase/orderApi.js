import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

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