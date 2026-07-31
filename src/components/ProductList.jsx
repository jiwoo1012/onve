import React from 'react'
import ProductCard from './ProductCard'
import styles from './ProductList.module.scss'

const ProductList = ({ products =[], onWishItem }) => {
  if(products.length===0){
    return <p className={styles.emptyMessage}>등록된 상품이 없습니다.</p>
  }
  return (
    <div className={styles.productList}>
      {
        products.map((item) => (
          <ProductCard key={item.id} product={item} onWishItem={onWishItem}/>
        ))
      }
    </div>
  )
}

export default ProductList
