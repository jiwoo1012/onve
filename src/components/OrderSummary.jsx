import React from 'react'
import styles from './OrderSummary.module.scss'

const OrderSummary = ({ subTotal, deliveryFee, totalPrice, onOrder, isOrdering = false }) => {
  return (
    <section className={styles.summary}>
      <h2>결제 예정 금액</h2>

      <dl className={styles.row}>
        <dt>상품 금액</dt>
        <dd>{subTotal.toLocaleString()}원</dd>
      </dl>

      <dl className={styles.row}>
        <dt>배송비</dt>
        <dd>{deliveryFee === 0 ? '무료' : `${deliveryFee.toLocaleString()}원`}</dd>
      </dl>

      <dl className={`${styles.row} ${styles.totalRow}`}>
        <dt>총 결제 금액</dt>
        <dd>{totalPrice.toLocaleString()}원</dd>
      </dl>

      <button type="button" className={styles.orderButton} disabled={subTotal===0 || isOrdering} onClick={onOrder}>
        {isOrdering ? '주문 처리 중...' : '주문하기'}
      </button>
    </section>
  )
}

export default OrderSummary
