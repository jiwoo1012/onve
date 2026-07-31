import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductList from '../components/ProductList'
import ProductSort from '../components/ProductSort'
import EmptyMessage from '../components/EmptyMessage'
import { getProducts } from '../firebase/productApi'
import styles from './SearchResult.module.scss'

const getFinalPrice = (product) => product.price - (product.price * (product.discountRate || 0)) / 100
const sortProducts = (products, sortBy) => {
  const sorted = [...products]
  if (sortBy === 'popular') return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
  if (sortBy === 'newest') return sorted.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
  if (sortBy === 'priceAsc') return sorted.sort((a, b) => getFinalPrice(a) - getFinalPrice(b))
  if (sortBy === 'priceDesc') return sorted.sort((a, b) => getFinalPrice(b) - getFinalPrice(a))
  if (sortBy === 'name') return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  return sorted
}

const SearchResult = () => {
  const { keyword } = useParams()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('popular')

  useEffect(() => {
    getProducts().then(setProducts).catch((error) => { console.error(error); setProducts([]) }).finally(() => setIsLoading(false))
  }, [])

  const decodedKeyword = decodeURIComponent(keyword || '')
  const displayedProducts = sortProducts(products.filter((product) => product.name.toLowerCase().includes(decodedKeyword.toLowerCase())), sortBy)

  if (isLoading) return <p className={styles.loadingMessage}>검색 중입니다.</p>

  return (
    <section className={styles.searchResult}>
      <div className={styles.header}>
        <div className={styles.titleArea}><p className={styles.eyebrow}>SEARCH RESULT</p><h1>'{decodedKeyword}' 검색 결과 <span>{displayedProducts.length}개</span></h1></div>
        {displayedProducts.length > 0 && <ProductSort sortBy={sortBy} setSortBy={setSortBy} />}
      </div>
      {displayedProducts.length === 0 ? <EmptyMessage image="/img/empty/no-product.png" title="검색 결과가 없습니다." desc="다른 검색어로 다시 시도해보세요." link="/products" linkText="전체 상품 보기" /> : <ProductList products={displayedProducts} />}
    </section>
  )
}

export default SearchResult
