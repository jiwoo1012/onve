const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

exports.completeOrder = onCall({ region: 'asia-northeast3' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  }

  const items = request.data?.items
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', '주문 상품이 없습니다.')
  }

  const normalizedItems = items.map((item) => ({
    productId: String(item.productId || ''),
    quantity: Number(item.quantity),
  }))

  if (normalizedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new HttpsError('invalid-argument', '주문 수량이 올바르지 않습니다.')
  }

  const orderRef = db.collection('orders').doc()

  const order = await db.runTransaction(async (transaction) => {
    const productSnapshots = await Promise.all(normalizedItems.map((item) => transaction.get(db.collection('products').doc(item.productId))))
    const orderItems = []
    let totalPrice = 0

    for (let index = 0; index < normalizedItems.length; index += 1) {
      const item = normalizedItems[index]
      const productSnapshot = productSnapshots[index]
      if (!productSnapshot.exists) throw new HttpsError('not-found', '상품을 찾을 수 없습니다.')

      const product = productSnapshot.data()
      const stock = Number(product.stock || 0)
      if (stock < item.quantity) throw new HttpsError('failed-precondition', `${product.name} 상품의 재고가 부족합니다.`)

      const price = Math.round(Number(product.price || 0) * (1 - Number(product.discountRate || 0) / 100))
      totalPrice += price * item.quantity
      orderItems.push({ productId: productSnapshot.id, productName: product.name, price, quantity: item.quantity })

      transaction.update(productSnapshot.ref, {
        stock: stock - item.quantity,
        updatedAt: FieldValue.serverTimestamp(),
        updateAt: FieldValue.serverTimestamp(),
      })
    }

    transaction.set(orderRef, {
      userId: request.auth.uid,
      productName: orderItems.length === 1 ? orderItems[0].productName : `${orderItems[0].productName} 외 ${orderItems.length - 1}건`,
      quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice,
      items: orderItems,
      createAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { totalPrice, quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0) }
  })

  return { orderId: orderRef.id, ...order }
})
