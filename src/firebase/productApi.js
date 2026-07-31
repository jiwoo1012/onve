import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const productsCollection = collection(db, 'products')

export const getProducts = async () => {
  const productsSnapshot = await getDocs(productsCollection)

  return productsSnapshot.docs.map((productDocument) => ({
    id: productDocument.id,
    ...productDocument.data(),
  }))
}

export const getProductById = async (id) => {
  const productSnapshot = await getDoc(doc(db, 'products', id))
  return productSnapshot.exists() ? { id: productSnapshot.id, ...productSnapshot.data() } : null
}

export const createProduct = (product) =>
  addDoc(productsCollection, {
    ...product,
    salesCount: Number(product.salesCount || 0),
    isRecommended: Boolean(product.isRecommended),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updateAt: serverTimestamp(),
  })

export const updateProduct = (id, product) =>
  updateDoc(doc(db, 'products', id), {
    ...product,
    salesCount: Number(product.salesCount || 0),
    isRecommended: Boolean(product.isRecommended),
    updatedAt: serverTimestamp(),
    updateAt: serverTimestamp(),
  })

export const updateProductStock = (id, stock) => {
  if (!Number.isInteger(stock) || stock < 0) throw new Error('invalid-stock')

  return updateDoc(doc(db, 'products', id), {
    stock,
    updatedAt: serverTimestamp(),
    updateAt: serverTimestamp(),
  })
}
export const updateProductOrder = async (id, order) => {
  await updateDoc(doc(db, 'products', id), { recommendOrder: order })
}

export const updateProductRecommendation = (id, isRecommended) =>
  updateDoc(doc(db, 'products', id), {
    isRecommended: Boolean(isRecommended),
    updatedAt: serverTimestamp(),
    updateAt: serverTimestamp(),
  })

export const deleteProduct = (id) => deleteDoc(doc(db, 'products', id))

export const migrateProductsFromJson = async (products) => {
  const existingProducts = await getProducts()
  const legacyIds = new Set(existingProducts.map((product) => product.legacyId).filter(Boolean))
  let createdCount = 0

  for (const product of products) {
    if (legacyIds.has(product.id)) continue

    await addDoc(productsCollection, {
      legacyId: product.id,
      name: product.name,
      category: product.category,
      categoryName: product.category,
      description: product.description,
      price: Number(product.price),
      discountRate: Number(product.discountRate || 0),
      stock: Number(product.stock || 0),
      image: product.image,
      salesCount: Number(product.salesCount || 0),
      isRecommended: false,
      createdAt: Timestamp.fromDate(new Date(product.createdAt)),
      migratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updateAt: serverTimestamp(),
    })
    createdCount += 1
  }

  return createdCount
}
