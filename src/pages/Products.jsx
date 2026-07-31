import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductList from '../components/ProductList'
import ProductSort from '../components/ProductSort'
import { getProducts } from '../firebase/productApi'
import styles from './Products.module.scss'

const getFinalPrice = (product) => product.price - (product.price * (product.discountRate || 0)) / 100

const sortProducts = (products, sortBy) => {
  const sorted = [...products]

  switch (sortBy) {
    case 'popular': return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    case 'newest': return sorted.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    case 'priceAsc': return sorted.sort((a, b) => getFinalPrice(a) - getFinalPrice(b))
    case 'priceDesc': return sorted.sort((a, b) => getFinalPrice(b) - getFinalPrice(a))
    case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    default: return sorted
  }
}

const Products = () => {
  const { category } = useParams()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('popular')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProducts(await getProducts())
      } catch (error) {
        console.error(error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  const selectedCategory = category?.toUpperCase()
  const filteredProducts = selectedCategory ? products.filter((product) => product.category === selectedCategory) : products
  const displayedProducts = sortProducts(filteredProducts, sortBy)

  if (isLoading) return <p className={styles.loadingMessage}>상품을 불러오는 중입니다.</p>

  return (
    <section className={styles.products}>
      <div className={styles.header}>
        <h1>{selectedCategory ? `${selectedCategory} 상품` : '전체 상품'}</h1>
        <ProductSort sortBy={sortBy} setSortBy={setSortBy} />
      </div>
      <ProductList products={displayedProducts} />
    </section>
  )
}

export default Products
