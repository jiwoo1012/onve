import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { auth } from './firebase'

const noticesCollection = collection(db, 'notices')
const sortByNewest = (notices) => notices.sort((a, b) => (b.createAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) - (a.createAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0))

export const getNotices = async () => sortByNewest((await getDocs(noticesCollection)).docs.map((item) => ({ id: item.id, ...item.data() })))
export const getNoticeById = async (id) => { const item = await getDoc(doc(db, 'notices', id)); return item.exists() ? { id: item.id, ...item.data() } : null }
export const createNotice = ({ title, content, category, isPinned, status, createdAt }) => {
  if (!auth.currentUser) throw new Error('unauthenticated')

  return addDoc(noticesCollection, {
    title,
    content,
    category,
    isPinned,
    status,
    createdAt: createdAt || serverTimestamp(),
    authorUid: auth.currentUser.uid,
    createAt: serverTimestamp(),
    updateAt: serverTimestamp(),
  })
}

export const updateNotice = (id, { title, content, category, isPinned, status }) =>
  updateDoc(doc(db, 'notices', id), { title, content, category, isPinned, status, updateAt: serverTimestamp() })
export const deleteNotice = (id) => deleteDoc(doc(db, 'notices', id))
