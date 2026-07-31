import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, query, where } from 'firebase/firestore'
import { db } from './firebase'

const sortNewest = (reviews) => reviews.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
const toReviews = (snapshot) => sortNewest(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))

export const getReviewsByProductId = async (productId) => toReviews(await getDocs(query(collection(db, 'reviews'), where('productId', '==', productId))))
export const getAllReviews = async () => toReviews(await getDocs(collection(db, 'reviews')))
export const addReview = (reviewData) => addDoc(collection(db, 'reviews'), { ...reviewData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
export const updateReview = (reviewId, updateData) => updateDoc(doc(db, 'reviews', reviewId), { ...updateData, updatedAt: serverTimestamp() })
export const deleteReview = (reviewId) => deleteDoc(doc(db, 'reviews', reviewId))
