import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { createProduct, deleteProduct, getProducts, migrateProductsFromJson, updateProduct, updateProductStock } from '../firebase/productApi'
import styles from './AdminProductManager.module.scss'

const CATEGORY_OPTIONS = [
  { label: '스킨케어', code: 'SKINCARE' },
  { label: '클렌징', code: 'CLEANSING' },
  { label: '리프팅', code: 'LIFTING' },
  { label: 'LED 케어', code: 'LED' },
  { label: '바디 케어', code: 'BODY' },
  { label: '헤어 케어', code: 'HAIR' },
]

const initialProduct = {
  name: '',
  categoryCode: 'SKINCARE',
  price: '',
  discountRate: '0',
  stock: '',
  imageType: 'url',
  image: '',
  description: '',
  status: 'active',
  isRecommended: false
}

const LOW_STOCK_THRESHOLD = 5

const formatNumber = (num) => {
  if (num === '' || num === null || num === undefined || isNaN(num)) return ''
  return new Intl.NumberFormat('ko-KR').format(num)
}

const unformatNumber = (str) => {
  if (typeof str === 'number') return str
  return String(str).replace(/[^0-9]/g, '')
}

const AdminProductManager = () => {
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialProduct)
  const [editingId, setEditingId] = useState(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [errors, setErrors] = useState({})
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' })
  const [imgError, setImgError] = useState(false)

  const [editingStockMap, setEditingStockMap] = useState({})

  const [detailModalProduct, setDetailModalProduct] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStockStatus, setSelectedStockStatus] = useState('all')
  const [selectedRecommendStatus, setSelectedRecommendStatus] = useState('all')
  const [selectedSalesStatus, setSelectedSalesStatus] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  
  const [selectedIds, setSelectedIds] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 3500)
  }

  const loadProducts = async () => {
    setIsLoading(true)
    try { 
      const loaded = await getProducts()
      const sorted = loaded.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setProducts(sorted) 

      if (location.state?.editProduct) {
        handleStartEdit(location.state.editProduct)
      } else if (location.state?.filter) {
        if (location.state.filter === 'stock:lowStock') {
          setSelectedStockStatus('lowStock')
        }
      }
    } catch (error) { 
      console.error(error)
      showToast('상품 목록을 불러오지 못했습니다.', 'error') 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedCategory, selectedStockStatus, selectedRecommendStatus, selectedSalesStatus, itemsPerPage])

  const finalPrice = useMemo(() => {
    const rawPrice = Number(unformatNumber(form.price)) || 0
    const discount = Number(form.discountRate) || 0
    if (rawPrice <= 0) return 0
    return Math.round(rawPrice * (1 - discount / 100))
  }, [form.price, form.discountRate])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setErrors((prev) => ({ ...prev, [name]: '' }))

    if (name === 'price') {
      const numeric = unformatNumber(value)
      setForm((prev) => ({ ...prev, price: numeric ? formatNumber(numeric) : '' }))
      return
    }

    if (name === 'discountRate') {
      let numVal = Number(value)
      if (numVal < 0) numVal = 0
      if (numVal > 100) numVal = 100
      setForm((prev) => ({ ...prev, discountRate: String(numVal) }))
      return
    }

    if (name === 'image') {
      setImgError(false)
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const fakeUrl = URL.createObjectURL(file)
      setForm((prev) => ({ ...prev, image: fakeUrl }))
      setImgError(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = '상품명을 입력해주세요.'
    if (!form.price || Number(unformatNumber(form.price)) <= 0) newErrors.price = '가격은 0원보다 커야 합니다.'
    if (form.stock === '' || !/^\d+$/.test(form.stock)) newErrors.stock = '재고는 0 이상의 정수를 입력해주세요.'
    if (!form.image.trim()) newErrors.image = '상품 이미지를 입력하거나 업로드해주세요.'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const rawStock = Number(form.stock)
    const rawPrice = Number(unformatNumber(form.price))
    const rawDiscount = Number(form.discountRate || 0)

    const selectedCatObj = CATEGORY_OPTIONS.find((c) => c.code === form.categoryCode) || CATEGORY_OPTIONS[0]

    const isAlreadyRecommended = editingId && products.find((p) => p.id === editingId)?.isRecommended
    if (form.isRecommended && !isAlreadyRecommended && products.filter((p) => p.isRecommended).length >= 5) {
      showToast('추천 상품은 최대 5개까지 설정 가능합니다.', 'error')
      return
    }

    setIsSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.categoryCode,
      categoryName: selectedCatObj.label,
      price: rawPrice,
      discountRate: rawDiscount,
      stock: rawStock,
      image: form.image.trim(),
      description: form.description.trim(),
      status: form.status,
      isRecommended: Boolean(form.isRecommended),
    }

    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        showToast('상품 정보가 수정되었습니다.')
      } else {
        await createProduct(payload)
        showToast('신규 상품이 등록되었습니다.')
      }
      handleCancelForm()
      await loadProducts()
    } catch (error) {
      console.error(error)
      showToast('상품 저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelForm = () => {
    setEditingId(null)
    setForm(initialProduct)
    setErrors({})
    setIsFormOpen(false)
    setImgError(false)
  }

  const handleStartEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      categoryCode: product.category || 'SKINCARE',
      price: product.price ? formatNumber(product.price) : '',
      discountRate: String(product.discountRate ?? 0),
      stock: String(product.stock ?? ''),
      imageType: 'url',
      image: product.image || '',
      description: product.description || '',
      status: product.status || 'active',
      isRecommended: Boolean(product.isRecommended),
    })
    setErrors({})
    setIsFormOpen(true)
    window.scrollTo({ top: 100, behavior: 'smooth' })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteProduct(deleteConfirmId)
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmId))
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmId))
      showToast('상품이 삭제되었습니다.')
    } catch (error) {
      console.error(error)
      showToast('상품 삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleStockInputChange = (id, val) => {
    if (val === '' || /^\d+$/.test(val)) {
      setEditingStockMap((prev) => ({ ...prev, [id]: val }))
    }
  }

  const handleSaveInlineStock = async (product) => {
    const newStockStr = editingStockMap[product.id]
    if (newStockStr === undefined || newStockStr === String(product.stock)) return

    const newStock = Number(newStockStr)
    try {
      await updateProductStock(product.id, newStock)
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, stock: newStock } : item))
      showToast(`재고가 ${newStock}개로 수정되었습니다.`)
    } catch (error) {
      console.error(error)
      showToast('재고 저장 실패', 'error')
    } finally {
      setEditingStockMap((prev) => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
    }
  }

  const handleExecuteMigration = async () => {
    setIsMigrationModalOpen(false)
    setIsSaving(true)
    try {
      const res = await fetch('/data/products.json')
      if (!res.ok) throw new Error('파일을 불러올 수 없습니다.')
      const json = await res.json()
      const count = await migrateProductsFromJson(json)
      showToast(`${count}개의 상품 데이터를 이전했습니다.`)
      await loadProducts()
    } catch (error) {
      console.error(error)
      showToast('데이터 이전 실패', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pagedProducts.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelectId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`선택한 ${selectedIds.length}개 상품을 삭제하시겠습니까?`)) return

    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)))
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      showToast(`${selectedIds.length}개 상품이 삭제되었습니다.`)
      setSelectedIds([])
    } catch (error) {
      console.error(error)
      showToast('일괄 삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm.trim() && !p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) return false
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (selectedStockStatus === 'normalStock' && p.stock <= LOW_STOCK_THRESHOLD) return false
      if (selectedStockStatus === 'lowStock' && (p.stock === 0 || p.stock > LOW_STOCK_THRESHOLD)) return false
      if (selectedStockStatus === 'soldOut' && p.stock !== 0) return false
      if (selectedRecommendStatus === 'recommended' && !p.isRecommended) return false
      if (selectedRecommendStatus === 'normal' && p.isRecommended) return false
      if (selectedSalesStatus !== 'all' && (p.status || 'active') !== selectedSalesStatus) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'priceAsc') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'priceDesc') return (b.price || 0) - (a.price || 0)
      if (sortBy === 'stockAsc') return (a.stock || 0) - (b.stock || 0)
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    })
  }, [products, searchTerm, selectedCategory, selectedStockStatus, selectedRecommendStatus, selectedSalesStatus, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const pagedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const isAllSelected = pagedProducts.length > 0 && pagedProducts.every((p) => selectedIds.includes(p.id))
  const recommendedCount = products.filter((p) => p.isRecommended).length

  return (
    <div className={styles.manager}>
      {toastMessage.text && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.text}
        </div>
      )}

      {/* 1. 상단 관리 타이틀 */}
      <div className={styles.topBar}>
        <div className={styles.topBarTitleGroup}>
          <h3>상품 등록 및 정보 관리</h3>
          <p className={styles.topBarSubText}>새로운 상품을 등록하거나, 기존 상품의 판매 상태 및 재고를 관리합니다.</p>
        </div>

        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.migrationBtn}
            onClick={() => setIsMigrationModalOpen(true)}
          >
            ⚙️ JSON 데이터 가져오기
          </button>

          {!isFormOpen && (
            <button
              type="button"
              className={styles.openFormBtn}
              onClick={() => { setForm(initialProduct); setEditingId(null); setIsFormOpen(true); }}
            >
              + 신규 상품 등록하기
            </button>
          )}
        </div>
      </div>

      {/* 2. 상품 등록/수정 폼 */}
      {isFormOpen && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formCardHeader}>
            <h4>{editingId ? '상품 정보 수정' : '신규 상품 등록'}</h4>
            <button type="button" className={styles.closeFormBtn} onClick={handleCancelForm}>✕ 닫기</button>
          </div>

          <div className={styles.formSection}>
            <h5 className={styles.sectionTitle}>기본 정보</h5>
            <div className={styles.sectionGrid}>
              <div className={styles.fieldItem}>
                <label>상품명 <span className={styles.required}>*</span></label>
                <input
                  name="name"
                  className={styles.styledInput}
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="예: ONVÉ 갈바닉 마사지기"
                />
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>

              <div className={styles.fieldItem}>
                <label>표시 카테고리 <span className={styles.required}>*</span></label>
                <select name="categoryCode" className={styles.styledInput} value={form.categoryCode} onChange={handleInputChange}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldItem}>
                <label>판매 상태</label>
                <select name="status" className={styles.styledInput} value={form.status} onChange={handleInputChange}>
                  <option value="active">판매 중</option>
                  <option value="hidden">숨김 / 판매 중지</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h5 className={styles.sectionTitle}>가격 · 할인 · 재고</h5>
            <div className={styles.sectionGridFour}>
              <div className={styles.fieldItem}>
                <label>정가 <span className={styles.required}>*</span></label>
                <div className={styles.inputWithUnit}>
                  <input
                    name="price"
                    type="text"
                    inputMode="numeric"
                    className={styles.styledInput}
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="259,000"
                  />
                  <span className={styles.unitText}>원</span>
                </div>
                {errors.price && <span className={styles.fieldError}>{errors.price}</span>}
              </div>

              <div className={styles.fieldItem}>
                <label>할인율 (%)</label>
                <div className={styles.inputWithUnit}>
                  <input
                    name="discountRate"
                    type="number"
                    min="0"
                    max="100"
                    className={styles.styledInput}
                    value={form.discountRate}
                    onChange={handleInputChange}
                  />
                  <span className={styles.unitText}>%</span>
                </div>
              </div>

              <div className={styles.fieldItem}>
                <label>최종 판매가 (자동 계산)</label>
                <div className={styles.readOnlyPrice}>
                  <strong>{formatNumber(finalPrice)}</strong> 원
                </div>
              </div>

              <div className={styles.fieldItem}>
                <label>재고 수량 <span className={styles.required}>*</span></label>
                <div className={styles.inputWithUnit}>
                  <input
                    name="stock"
                    type="text"
                    inputMode="numeric"
                    className={styles.styledInput}
                    value={form.stock}
                    onChange={handleInputChange}
                    placeholder="20"
                  />
                  <span className={styles.unitText}>개</span>
                </div>
                {errors.stock && <span className={styles.fieldError}>{errors.stock}</span>}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h5 className={styles.sectionTitle}>이미지 · 설명</h5>
            <div className={styles.sectionGrid}>
              <div className={`${styles.full} ${styles.imageFieldBlock}`}>
                {/* 라벨과 스위치 버튼 수평 정렬 */}
                <div className={styles.imageHeaderRow}>
                  <label>상품 이미지 <span className={styles.required}>*</span></label>
                  
                  {/* 또렷한 세그먼트 스위치 버튼 UI */}
                  <div className={styles.imageTypeSwitch}>
                    <button
                      type="button"
                      className={form.imageType === 'url' ? styles.activeSwitch : ''}
                      onClick={() => setForm((prev) => ({ ...prev, imageType: 'url' }))}
                    >
                      URL 직접 입력
                    </button>
                    <button
                      type="button"
                      className={form.imageType === 'file' ? styles.activeSwitch : ''}
                      onClick={() => setForm((prev) => ({ ...prev, imageType: 'file' }))}
                    >
                      파일 업로드
                    </button>
                  </div>
                </div>

                {form.imageType === 'url' ? (
                  <input
                    name="image"
                    className={styles.styledInput}
                    value={form.image}
                    onChange={handleInputChange}
                    placeholder="/img/products/product01.png 또는 https://..."
                  />
                ) : (
                  <input type="file" accept="image/*" className={styles.styledInput} onChange={handleFileUpload} />
                )}
                {errors.image && <span className={styles.fieldError}>{errors.image}</span>}

                <div className={styles.previewContainer}>
                  <span className={styles.previewLabel}>이미지 미리보기</span>
                  {form.image && !imgError ? (
                    <img
                      src={form.image}
                      alt="미리보기"
                      className={styles.imagePreview}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className={styles.noImagePreview}>
                      {imgError ? '이미지를 불러올 수 없습니다.' : '등록된 이미지 없음'}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${styles.full} ${styles.fieldItem}`}>
                <div className={styles.descriptionHeader}>
                  <label>상품 설명</label>
                  <span className={styles.charCounter}>{form.description.length} / 1,000자</span>
                </div>
                <textarea
                  name="description"
                  maxLength={1000}
                  className={styles.styledInput}
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="상품의 특징, 사용 방법, 권장 대상 등을 입력해주세요."
                />
              </div>

              <div className={`${styles.full} ${styles.recommendCheckCard}`}>
                <label className={styles.recommendCheckLabel}>
                  <input
                    name="isRecommended"
                    type="checkbox"
                    checked={form.isRecommended}
                    disabled={!form.isRecommended && recommendedCount >= 5}
                    onChange={handleInputChange}
                  />
                  <div className={styles.recommendCheckText}>
                    <strong>추천 상품으로 등록 (메인 영역 노출)</strong>
                    <span>
                      {recommendedCount >= 5 && !form.isRecommended
                        ? '추천 상품 등록 한도(5개)에 도달했습니다.'
                        : `메인 페이지 추천 영역에 노출됩니다. (현재 ${recommendedCount}/5개 설정됨)`}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.formFooterButtons}>
            <button type="button" className={styles.ghostButton} onClick={handleCancelForm}>
              {editingId ? '수정 취소' : '닫기'}
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              {isSaving ? '저장 중...' : editingId ? '변경사항 저장' : '상품 등록 완료'}
            </button>
          </div>
        </form>
      )}

      {/* 3. 등록 상품 목록 섹션 */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <div>
            <h3>등록 상품 목록</h3>
            <p className={styles.criteriaGuide}>
              재고 상태 기준 &mdash; <span className={styles.badgeNormal}>정상: 6개 이상</span> |{' '}
              <span className={styles.badgeLow}>부족: 1~5개</span> | <span className={styles.badgeSold}>품절: 0개</span>
            </p>
          </div>
          <span className={styles.totalBadge}>총 {filteredProducts.length}개 상품</span>
        </div>

        {/* 필터 툴바 */}
        <div className={styles.filterToolbar}>
          <div className={styles.filterGroup}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="상품명 검색..."
                value={searchTerm}
                className={styles.styledInput}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')}>✕</button>}
            </div>

            <select className={styles.styledInput} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">전체 카테고리</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>

            <select className={styles.styledInput} value={selectedStockStatus} onChange={(e) => setSelectedStockStatus(e.target.value)}>
              <option value="all">전체 재고 상태</option>
              <option value="normalStock">재고 정상 (6개 이상)</option>
              <option value="lowStock">재고 부족 (1~5개)</option>
              <option value="soldOut">품절 (0개)</option>
            </select>

            <select className={styles.styledInput} value={selectedSalesStatus} onChange={(e) => setSelectedSalesStatus(e.target.value)}>
              <option value="all">전체 판매 상태</option>
              <option value="active">판매 중</option>
              <option value="hidden">숨김 / 중지</option>
            </select>

            <select className={styles.styledInput} value={selectedRecommendStatus} onChange={(e) => setSelectedRecommendStatus(e.target.value)}>
              <option value="all">추천 여부 전체</option>
              <option value="recommended">추천 상품만</option>
              <option value="normal">일반 상품만</option>
            </select>
          </div>

          <div className={styles.sortGroup}>
            <select className={styles.styledInput} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">최신 등록순</option>
              <option value="priceAsc">가격 낮은순</option>
              <option value="priceDesc">가격 높은순</option>
              <option value="stockAsc">재고 적은순</option>
            </select>
          </div>
        </div>

        {/* 일괄 액션 바 */}
        {selectedIds.length > 0 && (
          <div className={styles.batchActionBar}>
            <span>☑ <strong>{selectedIds.length}</strong>개 선택됨</span>
            <button type="button" className={styles.batchDeleteBtn} onClick={handleBatchDelete}>
              선택 상품 일괄 삭제
            </button>
          </div>
        )}

        {/* 상품 목록 테이블 */}
        {isLoading ? (
          <p className={styles.loadingText}>상품 목록을 불러오는 중입니다...</p>
        ) : pagedProducts.length === 0 ? (
          <p className={styles.emptyText}>조건에 일치하는 상품이 없습니다.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={isAllSelected} onChange={handleToggleSelectAll} />
                  </th>
                  <th style={{ width: '64px' }}>이미지</th>
                  <th>상품 정보</th>
                  <th style={{ width: '110px' }}>카테고리</th>
                  <th style={{ width: '130px' }}>판매가</th>
                  <th style={{ width: '120px' }}>재고 수량</th>
                  <th style={{ width: '100px' }}>재고 상태</th>
                  <th style={{ width: '90px' }}>판매 상태</th>
                  <th style={{ width: '110px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((product) => {
                  const catLabel = CATEGORY_OPTIONS.find((c) => c.code === product.category)?.label || product.categoryName || '-'
                  const discount = Number(product.discountRate || 0)
                  const calcFinal = discount > 0 ? Math.round(product.price * (1 - discount / 100)) : product.price
                  
                  const isStockEditing = editingStockMap[product.id] !== undefined
                  const currentStockInputValue = isStockEditing ? editingStockMap[product.id] : String(product.stock ?? 0)

                  return (
                    <tr key={product.id} className={selectedIds.includes(product.id) ? styles.selectedRow : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => handleToggleSelectId(product.id)}
                        />
                      </td>
                      <td>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={styles.rowThumb}
                          onClick={() => setDetailModalProduct(product)}
                          onError={(e) => { e.currentTarget.src = '/img/logo-05.png' }}
                        />
                      </td>
                      <td>
                        <div className={styles.nameCell}>
                          <span
                            className={styles.productClickableName}
                            onClick={() => setDetailModalProduct(product)}
                          >
                            {product.name}
                          </span>
                          {product.isRecommended && <span className={styles.recBadge}>★ 추천</span>}
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryLabelText}>{catLabel}</span>
                      </td>
                      <td>
                        <div className={styles.priceCell}>
                          <strong className={styles.finalPriceText}>{formatNumber(calcFinal)}원</strong>
                          {discount > 0 && (
                            <span className={styles.originalPriceText}>
                              {formatNumber(product.price)}원 ({discount}%↓)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.inlineStockCell}>
                          <input
                            type="text"
                            inputMode="numeric"
                            className={styles.stockInput}
                            value={currentStockInputValue}
                            onChange={(e) => handleStockInputChange(product.id, e.target.value)}
                          />
                          {isStockEditing && currentStockInputValue !== String(product.stock) && (
                            <button
                              type="button"
                              className={styles.stockSaveBtn}
                              onClick={() => handleSaveInlineStock(product)}
                            >
                              저장
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.stockStatusBadge} ${
                          product.stock === 0
                            ? styles.badgeSoldOut
                            : product.stock <= LOW_STOCK_THRESHOLD
                            ? styles.badgeLowStock
                            : styles.badgeNormalStock
                        }`}>
                          {product.stock === 0 ? '품절' : product.stock <= LOW_STOCK_THRESHOLD ? '재고 부족' : '재고 정상'}
                        </span>
                      </td>
                      <td>
                        <span className={product.status === 'hidden' ? styles.statusHidden : styles.statusActive}>
                          {product.status === 'hidden' ? '숨김' : '판매 중'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleStartEdit(product)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => setDeleteConfirmId(product.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className={styles.paginationRow}>
          <div className={styles.itemsPerPageSelect}>
            <span>페이지당 목록:</span>
            <select className={styles.styledInput} value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                &lsaquo; 이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={page === currentPage ? styles.activePage : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                다음 &rsaquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 미리보기 모달 */}
      {detailModalProduct && (
        <div className={styles.modalBackdrop} onClick={() => setDetailModalProduct(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>상품 상세 정보 미리보기</h4>
              <button type="button" onClick={() => setDetailModalProduct(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalDetailGrid}>
                <img src={detailModalProduct.image} alt={detailModalProduct.name} className={styles.modalDetailImg} />
                <div className={styles.modalDetailMeta}>
                  <h5>{detailModalProduct.name}</h5>
                  <p className={styles.modalDetailPrice}>
                    판매가: <strong>{formatNumber(detailModalProduct.price)}원</strong>
                    {detailModalProduct.discountRate > 0 && ` (${detailModalProduct.discountRate}% 할인)`}
                  </p>
                  <p>재고: {detailModalProduct.stock}개</p>
                  <p>판매 상태: {detailModalProduct.status === 'hidden' ? '숨김' : '판매 중'}</p>
                  <p>추천 여부: {detailModalProduct.isRecommended ? '★ 추천 상품' : '일반 상품'}</p>
                </div>
              </div>
              <div className={styles.modalDetailDesc}>
                <h6>상품 설명</h6>
                <p>{detailModalProduct.description || '등록된 상품 설명이 없습니다.'}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.primaryButton} onClick={() => { handleStartEdit(detailModalProduct); setDetailModalProduct(null); }}>
                이 상품 수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
            <h4>상품 삭제 확인</h4>
            <p>이 상품을 삭제하시겠습니까?<br />삭제하면 상품 목록 및 추천 정보에서 제거됩니다.</p>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.ghostButton} onClick={() => setDeleteConfirmId(null)}>취소</button>
              <button type="button" className={styles.dangerButton} onClick={handleConfirmDelete}>상품 삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* JSON 마이그레이션 모달 */}
      {isMigrationModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsMigrationModalOpen(false)}>
          <div className={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
            <h4>기존 상품 데이터 가져오기</h4>
            <p>기존 <code>products.json</code> 데이터를 Firebase로 가져오시겠습니까?<br />중복된 상품이 추가될 수 있습니다.</p>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.ghostButton} onClick={() => setIsMigrationModalOpen(false)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={handleExecuteMigration}>데이터 가져오기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductManager