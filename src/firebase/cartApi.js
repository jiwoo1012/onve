import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export const getUserCartItems = async (uid) => {
  const cartSnapshot = await getDocs(collection(db, 'carts', uid, 'items'))

  return cartSnapshot.docs.map((itemDocument) => ({
    id: itemDocument.id,
    ...itemDocument.data(),
  }))
}

export const deleteCartItem = (uid, itemId) =>
  deleteDoc(doc(db, 'carts', uid, 'items', itemId))
