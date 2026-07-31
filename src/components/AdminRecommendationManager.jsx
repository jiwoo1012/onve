import { useEffect, useRef, useState } from 'react'
import * as productApi from '../firebase/productApi'
import styles from './AdminRecommendationManager.module.scss'

const { getProducts, updateProductRecommendation } = productApi

const MAX_RECOMMENDED = 5
const ITEMS_PER_PAGE = 10
const TOAST_DURATION = 2500

// 카테고리 코드 → 한글 라벨. 없는 코드는 원문 그대로 표시.
const CATEGORY_LABELS = {
  HAIR: '헤어 케어',
  BODY: '바디 케어',
  SKINCARE: '스킨케어',
  CLEANSING: '클렌징',
  LIFTING: '리프팅',
  LED: 'LED 케어',
}
const getCategoryLabel = (code) => CATEGORY_LABELS[code] || code || '-'

const AdminRecommendationManager = () => {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [savingId, setSavingId] = useState(null)

  const [activeTab, setActiveTab] = useState('recommended') // 'recommended' | 'available'
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [swapTargetId, setSwapTargetId] = useState(null) // 교체 대상으로 선택된 미추천 상품 id
  const [swapReplaceId, setSwapReplaceId] = useState('') // 교체될 기존 추천 상품 id

  const [orderedRecommendedIds, setOrderedRecommendedIds] = useState([])
  const dragIndexRef = useRef(null)
  const toastTimerRef = useRef(null)

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setMessage(''), TOAST_DURATION)
  }

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(data.sort((a, b) => a.name.localeCompare(b.name, 'ko'))))
      .catch((error) => { console.error(error); showMessage('상품 목록을 불러오지 못했습니다.', 'error') })
      .finally(() => setIsLoading(false))
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, categoryFilter, activeTab])

  // 추천 상품 집합이 바뀌어도 사용자가 정한 순서는 최대한 유지, 신규는 뒤에 추가, 해제된 건 제거
  useEffect(() => {
    const recommendedIds = products.filter((product) => product.isRecommended).map((product) => product.id)
    setOrderedRecommendedIds((current) => {
      const kept = current.filter((id) => recommendedIds.includes(id))
      const added = recommendedIds.filter((id) => !kept.includes(id))
      return [...kept, ...added]
    })
  }, [products])

  const recommendedCount = products.filter((product) => product.isRecommended).length
  const isFull = recommendedCount >= MAX_RECOMMENDED

  const setRecommendation = async (productId, nextValue) => {
    setSavingId(productId)
    try {
      await updateProductRecommendation(productId, nextValue)
      setProducts((items) => items.map((item) => item.id === productId ? { ...item, isRecommended: nextValue } : item))
      return true
    } catch (error) {
      console.error(error)
      showMessage('처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'error')
      return false
    } finally {
      setSavingId(null)
    }
  }

  const handleAdd = async (product) => {
    if (isFull) return
    const ok = await setRecommendation(product.id, true)
    if (ok) showMessage('추천 상품으로 등록되었습니다.')
  }

  const handleRemove = async (product) => {
    const ok = await setRecommendation(product.id, false)
    if (ok) showMessage('추천 상품에서 해제되었습니다.')
  }

  const openSwapPanel = (product) => {
    setSwapTargetId(product.id)
    setSwapReplaceId(orderedRecommendedIds[0] || '')
  }
  const closeSwapPanel = () => { setSwapTargetId(null); setSwapReplaceId('') }

  const confirmSwap = async (newProduct) => {
    if (!swapReplaceId) return
    setSavingId(newProduct.id)
    try {
      await updateProductRecommendation(swapReplaceId, false)
      await updateProductRecommendation(newProduct.id, true)
      setProducts((items) => items.map((item) => {
        if (item.id === swapReplaceId) return { ...item, isRecommended: false }
        if (item.id === newProduct.id) return { ...item, isRecommended: true }
        return item
      }))
      showMessage('추천 상품이 교체되었습니다.')
      closeSwapPanel()
    } catch (error) {
      console.error(error)
      showMessage('교체 중 오류가 발생했습니다. 다시 시도해주세요.', 'error')
    } finally {
      setSavingId(null)
    }
  }

  // 드래그 정렬: 화면 순서만 즉시 반영. 새로고침 후에도 유지하려면
  // productApi에 순서 저장 함수(예: updateProductOrder)를 추가해야 함.
  const handleDragStart = (index) => { dragIndexRef.current = index }
  const handleDragOver = (event) => event.preventDefault()
  const handleDrop = (index) => {
    const from = dragIndexRef.current
    if (from === null || from === index) return
    setOrderedRecommendedIds((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragIndexRef.current = null
    productApi.updateProductOrder?.(orderedRecommendedIds[from], index)
  }

  const categories = Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).sort()

  const matchesSearchAndCategory = (product) => {
    const matchesSearch = !searchTerm || product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.categoryName === categoryFilter
    return matchesSearch && matchesCategory
  }

  const recommendedProducts = orderedRecommendedIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean)
    .filter(matchesSearchAndCategory)

  const availableProducts = products.filter((product) => !product.isRecommended).filter(matchesSearchAndCategory)
  const totalPages = Math.max(1, Math.ceil(availableProducts.length / ITEMS_PER_PAGE))
  const pagedAvailableProducts = availableProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className={styles.manager}>
      <div className={styles.headerRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCount}>{recommendedCount}<em>/{MAX_RECOMMENDED}</em></span>
          <span className={styles.summaryLabel}>추천 상품 등록됨</span>
          {isFull && <span className={styles.limitBadge}>추천 한도 초과</span>}
        </div>
        <a className={styles.previewLink} href="/#best-items" target="_blank" rel="noreferrer">추천 영역 미리보기 ↗</a>
      </div>

      <div className={styles.tabs}>
        <button type="button" className={activeTab === 'recommended' ? styles.tabActive : ''} onClick={() => setActiveTab('recommended')}>
          추천 중 {recommendedCount}
        </button>
        <button type="button" className={activeTab === 'available' ? styles.tabActive : ''} onClick={() => setActiveTab('available')}>
          추천 가능한 상품 {products.length - recommendedCount}
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.filterField}>
          검색
          <input type="text" placeholder="상품명으로 검색" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
        <label className={styles.filterField}>
          카테고리
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">전체 카테고리</option>
            {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category)}</option>)}
          </select>
        </label>
      </div>

      {message && <p className={`${styles.toast} ${styles[messageType]}`}>{message}</p>}

      {isLoading ? <p className={styles.loading}>상품 목록을 불러오는 중입니다.</p> : activeTab === 'recommended' ? (
        recommendedProducts.length === 0 ? <p className={styles.empty}>추천 중인 상품이 없습니다.</p> : (
          <div className={`${styles.table} ${styles.recommendedTable}`}>
            <div className={styles.tableHead}>
              <span>순서</span><span>이미지</span><span>상품명</span><span>카테고리</span><span>가격</span><span>노출 상태</span><span>작업</span>
            </div>
            {recommendedProducts.map((product, index) => (
              <div
                className={styles.tableRow}
                key={product.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <span className={styles.dragHandle} title="드래그해서 순서 변경">⠿ {index + 1}</span>
                <img src={product.image} alt={product.name} className={styles.thumb} onError={(event) => { event.currentTarget.src = '' }} />
                <strong className={styles.name}>{product.name}</strong>
                <span className={`${styles.categoryBadge} ${styles[`cat_${product.categoryName}`] || ''}`}>{getCategoryLabel(product.categoryName)}</span>
                <span className={styles.price}>{Number(product.price || 0).toLocaleString()}원</span>
                <span className={styles.liveBadge}>노출 중</span>
                <button type="button" className={styles.removeButton} onClick={() => handleRemove(product)} disabled={savingId === product.id}>
                  {savingId === product.id ? '처리 중...' : '추천 해제'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {pagedAvailableProducts.length === 0 ? <p className={styles.empty}>조건에 맞는 상품이 없습니다.</p> : (
            <div className={`${styles.table} ${styles.availableTable}`}>
              <div className={styles.tableHead}>
                <span>이미지</span><span>상품명</span><span>카테고리</span><span>가격</span><span>작업</span>
              </div>
              {pagedAvailableProducts.map((product) => (
                <div className={styles.tableRow} key={product.id}>
                  <img src={product.image} alt={product.name} className={styles.thumb} onError={(event) => { event.currentTarget.src = '' }} />
                  <strong className={styles.name}>{product.name}</strong>
                  <span className={`${styles.categoryBadge} ${styles[`cat_${product.categoryName}`] || ''}`}>{getCategoryLabel(product.categoryName)}</span>
                  <span className={styles.price}>{Number(product.price || 0).toLocaleString()}원</span>
                  {swapTargetId === product.id ? (
                    <div className={styles.swapPanel}>
                      <button type="button" className={styles.confirmButton} onClick={() => confirmSwap(product)} disabled={savingId === product.id}>
                        {savingId === product.id ? '처리 중...' : '교체 확정'}
                      </button>
                      <button type="button" className={styles.cancelButton} onClick={closeSwapPanel}>취소</button>
                    </div>
                  ) : isFull ? (
                    <button
                      type="button"
                      className={styles.swapButton}
                      onClick={() => openSwapPanel(product)}
                      title="추천 상품은 최대 5개까지 등록할 수 있습니다. 기존 상품과 교체합니다."
                    >
                      교체
                    </button>
                  ) : (
                    <button type="button" className={styles.addButton} onClick={() => handleAdd(product)} disabled={savingId === product.id}>
                      {savingId === product.id ? '처리 중...' : '추천 설정'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>이전</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={page === currentPage ? styles.activePage : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>다음</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminRecommendationManager
