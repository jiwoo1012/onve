import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export const getUserWishlistItems = async (uid) => {
  const wishlistSnapshot = await getDocs(collection(db, 'wishlists', uid, 'items'))

  return wishlistSnapshot.docs.map((itemDocument) => ({
    id: itemDocument.id,
    ...itemDocument.data(),
  }))
}

export const deleteWishlistItem = (uid, itemId) =>
  deleteDoc(doc(db, 'wishlists', uid, 'items', itemId))
