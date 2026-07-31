import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export const getUserProfile = async (uid) => {
  const userSnapshot = await getDoc(doc(db, 'users', uid))

  if (!userSnapshot.exists()) {
    throw new Error('user-not-found')
  }

  return userSnapshot.data()
}

export const getUser = getUserProfile

export const updateUserNickname = (uid, nickname) =>
  updateDoc(doc(db, 'users', uid), { nickname })

export const getAllUserProfiles = async () => {
  const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  const usersSnapshot = await getDocs(usersQuery)

  return usersSnapshot.docs.map((userDocument) => ({
    id: userDocument.id,
    ...userDocument.data(),
  }))
}

export const createUserProfile = async (user, nickname = user.displayName) => {
  const userDocument = doc(db, 'users', user.uid)
  const userSnapshot = await getDoc(userDocument)

  if (userSnapshot.exists()) {
    return userSnapshot.data()
  }

  const userNickname = nickname || user.email?.split('@')[0] || '회원'

  await setDoc(userDocument, {
    email: user.email,
    nickname: userNickname,
    role: 'user',
    createdAt: serverTimestamp(),
  })

  return getUserProfile(user.uid)
}
