import React, { useEffect, useState } from 'react'
import { DELIVERY_MINIMUM } from '../constants/delivery'
import { saveLocal, loadLocal } from '../utils/localStorage'
import CartItem from '../components/CartItem'
import EmptyMessage from '../components/EmptyMessage'
import OrderSummary from '../components/OrderSummary'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase/firebase'
import useAuthStore from '../store/authStore'
import { usePointStore } from '../store/pointStore'
import { calculateEarnedPoints } from '../firebase/pointsApi'
import styles from './Cart.module.scss'

const Cart = () => {
  const user = useAuthStore((state) => state.user)
  const earnPoints = usePointStore((state) => state.earnPoints)

  const savedCartItem = loadLocal('cart', [])
  const [cartItem, setCartItem] = useState(savedCartItem)
  const [orderMessage, setOrderMessage] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)

  useEffect(() => {
    saveLocal('cart', cartItem)
  }, [cartItem])

  const clearCart = () => {
    const answer = window.confirm('장바구니 상품을 모두 삭제하시겠습니까?')
    if (answer) {
      setCartItem([])
    }
  }

  // 같은 상품의 바뀐 수량 변경
  const changeQuantity = (productId, newQuantity) => {
    const changeItem = cartItem.map((item) => {
      if (item.id === productId) {
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    setCartItem(changeItem)
  }

  // 거의 공식이라고 생각하셈(같지 않은 것만 걸러줌)
  const removeItem = (productId) => {
    const reItem = cartItem.filter((item) => item.id !== productId)
    setCartItem(reItem)
  }

  const getDiscountPrice = (item) => {
    const discountAmount = (item.price * item.discountRate) / 100
    return Math.round(item.price - discountAmount)
  }

  const subTotal = cartItem.reduce(
    (total, item) => total + getDiscountPrice(item) * item.quantity,
    0
  )

  // 기본 배송비 확인
  const deliveryFee = subTotal >= DELIVERY_MINIMUM ? 0 : 3000
  const totalPrice = subTotal + (cartItem.length > 0 ? deliveryFee : 0)

  const orderCart = async () => {
    if (!auth.currentUser) {
      setOrderMessage('주문하려면 로그인이 필요합니다.')
      return
    }

    setIsOrdering(true)
    setOrderMessage('')
    try {
      const completeOrder = httpsCallable(functions, 'completeOrder')
      await completeOrder({ items: cartItem.map((item) => ({ productId: item.id, quantity: item.quantity })) })

      // 주문 성공 후 포인트 적립 (배송비 제외, 상품 금액 기준)
      const earnedPoints = calculateEarnedPoints(subTotal)
      if (earnedPoints > 0) {
        try {
          await earnPoints(auth.currentUser.uid, earnedPoints)
        } catch (pointError) {
          // 포인트 적립 실패는 주문 자체를 막지 않음
          console.error(pointError)
        }
      }

      setCartItem([])
      setOrderMessage(
        earnedPoints > 0
          ? `주문이 완료되었습니다. ${earnedPoints.toLocaleString()}P가 적립되었어요.`
          : '주문이 완료되었습니다.'
      )
    } catch (error) {
      console.error(error)
      setOrderMessage(error.message?.includes('재고') ? error.message : '주문 처리 중 오류가 발생했습니다. 재고는 변경되지 않았습니다.')
    } finally {
      setIsOrdering(false)
    }
  }

  // ★ 모든 Hook 호출이 끝난 뒤, 여기서 조건부 return
  if (!user) {
    return (
      <section className={styles.cart}>
        <EmptyMessage
          image="/img/headerIcon_Black-04.png"
          title="로그인이 필요한 서비스입니다."
          desc="장바구니는 로그인 후 이용하실 수 있어요."
          link="/login"
          linkText="로그인하러 가기"
        />
      </section>
    )
  }

  return (
    <section className={styles.cart}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>CART</p>
        <h2>장바구니</h2>
        <span className={styles.count}>담은 상품: {cartItem.length}개</span>
      </div>

      {cartItem.length === 0 ? (
        <EmptyMessage
          image="/img/empty/empty-cart.png"
          title="장바구니가 비었습니다."
          desc="마음에 드는 상품을 장바구니에 담아보세요."
          link="/products"
          linkText="상품 보러가기"
        />
      ) : (
        <div className={styles.content}>
          <div className={styles.listArea}>
            <div className={styles.listHeader}>
              <strong>장바구니 상품</strong>
              <button type="button" className={styles.clearButton} onClick={clearCart}>
                전체 삭제
              </button>
            </div>

            {cartItem.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onChangeQuantity={changeQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <OrderSummary
            subTotal={subTotal}
            deliveryFee={deliveryFee}
            totalPrice={totalPrice}
            onOrder={orderCart}
            isOrdering={isOrdering}
          />
          {orderMessage && <p className={styles.orderMessage}>{orderMessage}</p>}
        </div>
      )}
    </section>
  )
}

export default Cart