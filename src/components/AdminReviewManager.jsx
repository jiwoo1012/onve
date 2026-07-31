import { useEffect, useState, useMemo } from 'react'
import useReviewStore from '../store/useReviewStore'
import { getProducts } from '../firebase/productApi'
import styles from './AdminReviewManager.module.scss'

const CONTENT_PREVIEW_LENGTH = 80

const parseReviewTitle = (content) => {
  if (!content) return { title: null, body: '' }
  const match = content.match(/^제목\s*[:：]\s*([^\n]+)/)
  if (!match) return { title: null, body: content }

  const rest = match[1]
  const newlineIndex = rest.indexOf('\n')

  if (newlineIndex !== -1) {
    return {
      title: rest.slice(0, newlineIndex).trim(),
      body: content.slice(match[0].length).trim(),
    }
  }

  const sentenceEnd = rest.search(/[.!?]\s/)
  if (sentenceEnd !== -1) {
    const title = rest.slice(0, sentenceEnd + 1).trim()
    const restStart = content.indexOf(title) + title.length
    return { title, body: content.slice(restStart).trim() }
  }

  return { title: null, body: content }
}

const formatDate = (dateInput) => {
  if (!dateInput) return '-'
  let date = null
  if (typeof dateInput?.toDate === 'function') {
    date = dateInput.toDate()
  } else if (dateInput instanceof Date) {
    date = dateInput
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput)
  }

  if (!date || Number.isNaN(date.getTime())) return '-'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const AdminReviewManager = () => {
  const reviews = useReviewStore((state) => state.reviews)
  const error = useReviewStore((state) => state.error)
  const fetchAll = useReviewStore((state) => state.fetchAll)
  const updateReview = useReviewStore((state) => state.update)
  const deleteReview = useReviewStore((state) => state.remove)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const [productImageMap, setProductImageMap] = useState({})

  useEffect(() => {
    const loadProductImages = async () => {
      try {
        const products = await getProducts()
        const map = {}
        products.forEach((product) => {
          map[product.id] = product.image
        })
        setProductImageMap(map)
      } catch (err) {
        console.error(err)
      }
    }
    loadProductImages()
  }, [])

  const products = useMemo(
    () => [
      { id: 'ALL', name: '전체 상품 보기' },
      ...Array.from(
        new Map(reviews.map((review) => [review.productId, { id: review.productId, name: review.productName }])).values()
      ),
    ],
    [reviews]
  )

  // 필터 및 검색
  const [selectedProductId, setSelectedProductId] = useState('ALL')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('latest')
  const [searchTerm, setSearchTerm] = useState('')

  // 상세 모달 & 삭제 확인 모달 & 토스트
  const [detailReview, setDetailReview] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' })
  const [adminMemoInput, setAdminMemoInput] = useState('')

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 3500)
  }

  // 통계
  const totalCount = reviews.length
  const averageRating = totalCount === 0 ? '0.0' : (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalCount).toFixed(1)
  const hiddenCount = reviews.filter((r) => r.status === 'hidden').length

  // 필터링 및 정렬
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        if (selectedProductId !== 'ALL' && review.productId !== selectedProductId) return false
        if (ratingFilter !== 'ALL' && Number(review.rating) !== Number(ratingFilter)) return false
        if (statusFilter === 'visible' && review.status === 'hidden') return false
        if (statusFilter === 'hidden' && review.status !== 'hidden') return false
        if (searchTerm.trim()) {
          const keyword = searchTerm.trim().toLowerCase()
          const matched =
            review.author?.toLowerCase().includes(keyword) ||
            review.content?.toLowerCase().includes(keyword) ||
            review.productName?.toLowerCase().includes(keyword)
          if (!matched) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0)
        }
        if (sortBy === 'ratingHigh') {
          return (b.rating || 0) - (a.rating || 0)
        }
        if (sortBy === 'ratingLow') {
          return (a.rating || 0) - (b.rating || 0)
        }
        return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
      })
  }, [reviews, selectedProductId, ratingFilter, statusFilter, searchTerm, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedProductId, ratingFilter, statusFilter, searchTerm, sortBy, itemsPerPage])

  const pagedReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleToggleVisibility = async (review) => {
    const nextStatus = review.status === 'hidden' ? 'visible' : 'hidden'
    const success = await updateReview(review.id, { status: nextStatus })
    if (success) {
      showToast(nextStatus === 'hidden' ? '리뷰가 숨김 처리되었습니다.' : '리뷰가 다시 노출됩니다.')
    } else {
      showToast('상태 변경 실패', 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    const success = await deleteReview(deleteConfirmId)
    if (success) {
      showToast('리뷰가 삭제되었습니다.')
    } else {
      showToast('리뷰 삭제 실패', 'error')
    }
    setDeleteConfirmId(null)
  }

  const handleSaveAdminMemo = async () => {
    if (!detailReview) return
    const success = await updateReview(detailReview.id, { adminMemo: adminMemoInput })
    if (success) {
      showToast('관리자 메모가 저장되었습니다.')
      setDetailReview((prev) => ({ ...prev, adminMemo: adminMemoInput }))
    } else {
      showToast('메모 저장 실패', 'error')
    }
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    showToast('리뷰 ID가 클립보드에 복사되었습니다.')
  }

  return (
    <div className={styles.manager}>
      {toastMessage.text && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.text}
        </div>
      )}

      {/* 1. 핵심 지표 배지 (강조형) */}
      <div className={styles.statHeader}>
        <div className={styles.statChipsGroup}>
          <div className={styles.statChipCard}>
            <span className={styles.statChipLabel}>전체 리뷰</span>
            <strong className={styles.statChipVal}>{totalCount}건</strong>
          </div>
          <div className={styles.statChipCard}>
            <span className={styles.statChipLabel}>평균 평점</span>
            <strong className={styles.statChipValStar}>★ {averageRating}</strong>
          </div>
          <div
            className={`${styles.statChipCard} ${styles.clickableChip}`}
            onClick={() => setStatusFilter(statusFilter === 'hidden' ? 'ALL' : 'hidden')}
          >
            <span className={styles.statChipLabel}>숨김 리뷰</span>
            <strong className={styles.statChipValAlert}>{hiddenCount}건</strong>
          </div>
        </div>

        <span className={styles.totalBadgeText}>검색 결과 총 {filteredReviews.length}건</span>
      </div>

      {/* 2. 한 줄 필터 및 검색 바 */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterLeftGroup}>
          <div className={styles.selectWrapper}>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={styles.styledSelect}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className={styles.styledSelect}
            >
              <option value="ALL">전체 평점</option>
              <option value="5">★ 5점만 보기</option>
              <option value="4">★ 4점만 보기</option>
              <option value="3">★ 3점만 보기</option>
              <option value="2">★ 2점만 보기</option>
              <option value="1">★ 1점만 보기</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.styledSelect}
            >
              <option value="ALL">전체 상태</option>
              <option value="visible">노출 중</option>
              <option value="hidden">숨김</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.styledSelect}
            >
              <option value="latest">최신 등록순</option>
              <option value="oldest">오래된순</option>
              <option value="ratingHigh">평점 높은순</option>
              <option value="ratingLow">평점 낮은순</option>
            </select>
          </div>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="작성자, 상품명, 내용 검색..."
            className={styles.styledSearchInput}
          />
          {searchTerm && <button type="button" onClick={() => setSearchTerm('')}>✕</button>}
        </div>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* 3. 리뷰 카드 리스트 */}
      <div className={styles.cardGrid}>
        {pagedReviews.map((review) => {
          const { title, body } = parseReviewTitle(review.content)
          const isHidden = review.status === 'hidden'
          const thumbnail = productImageMap[review.productId]

          return (
            <div key={review.id} className={`${styles.reviewCard} ${isHidden ? styles.cardMuted : ''}`}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.productMetaGroup}>
                  <img
                    src={thumbnail || '/img/logo-05.png'}
                    alt={review.productName}
                    className={styles.productThumb}
                    onError={(e) => { e.currentTarget.src = '/img/logo-05.png' }}
                  />
                  <div className={styles.productTextGroup}>
                    <strong className={styles.productName}>{review.productName || '상품명 미지정'}</strong>
                    <span className={styles.authorText}>작성자: {review.author || '고객'}</span>
                  </div>
                </div>

                <div className={styles.cardHeaderRight}>
                  <span className={isHidden ? styles.badgeHidden : styles.badgeVisible}>
                    {isHidden ? '숨김' : '노출 중'}
                  </span>
                  <div className={styles.ratingDateRow}>
                    <span className={styles.ratingStarText}>★ {review.rating || 5}.0</span>
                    <span className={styles.dividerDot}>|</span>
                    <span className={styles.dateText}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardBodyBox}>
                {title && <h5 className={styles.reviewParsedTitle}>{title}</h5>}
                <p className={styles.reviewContentPreview}>
                  {body.length > CONTENT_PREVIEW_LENGTH ? `${body.slice(0, CONTENT_PREVIEW_LENGTH)}...` : body}
                </p>
              </div>

              <div className={styles.cardFooterRow}>
                <button
                  type="button"
                  className={styles.detailLinkBtn}
                  onClick={() => {
                    setDetailReview(review)
                    setAdminMemoInput(review.adminMemo || '')
                  }}
                >
                  리뷰 상세보기 &rarr;
                </button>

                <div className={styles.actionButtonsGroup}>
                  <button
                    type="button"
                    className={isHidden ? styles.actionShowBtn : styles.actionHideBtn}
                    onClick={() => handleToggleVisibility(review)}
                  >
                    {isHidden ? '다시 노출' : '숨김 처리'}
                  </button>
                  <button
                    type="button"
                    className={styles.actionDeleteBtn}
                    onClick={() => setDeleteConfirmId(review.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {pagedReviews.length === 0 && (
          <div className={styles.emptyCardBox}>
            <p className={styles.emptyMessage}>조건에 부합하는 리뷰가 존재하지 않습니다.</p>
          </div>
        )}
      </div>

      {/* 4. 페이지네이션 & 보기 개수 */}
      <div className={styles.paginationBar}>
        <div className={styles.itemsPerPageSelect}>
          <span>목록 보기:</span>
          <select
            className={styles.styledSelect}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={6}>6개씩 보기</option>
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
          </select>
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationBtnGroup}>
            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lsaquo; 이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.pageNumberBtn} ${currentPage === page ? styles.activePageBtn : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              다음 &rsaquo;
            </button>
          </div>
        )}
      </div>

      {/* 상세 보기 통합 모달 */}
      {detailReview && (
        <div className={styles.modalBackdrop} onClick={() => setDetailReview(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>리뷰 상세 정보</h4>
              <button type="button" onClick={() => setDetailReview(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalProductMeta}>
                <img
                  src={productImageMap[detailReview.productId] || '/img/logo-05.png'}
                  alt={detailReview.productName}
                  className={styles.modalProductImg}
                />
                <div className={styles.modalProductInfo}>
                  <strong>{detailReview.productName}</strong>
                  <span className={styles.modalRatingText}>★ {detailReview.rating}.0점</span>
                </div>
              </div>

              <div className={styles.modalDlGrid}>
                <dt>작성자</dt>
                <dd>{detailReview.author || '고객'}</dd>
                <dt>작성일</dt>
                <dd>{formatDate(detailReview.createdAt)}</dd>
                <dt>노출 상태</dt>
                <dd>{detailReview.status === 'hidden' ? '숨김 처리됨' : '게시 중'}</dd>
                <dt>리뷰 ID</dt>
                <dd className={styles.reviewIdRow}>
                  <code>{detailReview.id}</code>
                  <button type="button" className={styles.copyBtn} onClick={() => handleCopyId(detailReview.id)}>
                    복사
                  </button>
                </dd>
              </div>

              <div className={styles.modalReviewContentBox}>
                <h6>리뷰 원문 내용</h6>
                <p>{detailReview.content}</p>
              </div>

              <div className={styles.modalMemoBox}>
                <h6>관리자 전용 메모</h6>
                <textarea
                  value={adminMemoInput}
                  onChange={(e) => setAdminMemoInput(e.target.value)}
                  placeholder="특이사항이나 문의 처리 내역을 메모하세요."
                />
                <button type="button" className={styles.memoSaveBtn} onClick={handleSaveAdminMemo}>
                  메모 저장
                </button>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={detailReview.status === 'hidden' ? styles.actionShowBtn : styles.actionHideBtn}
                onClick={async () => {
                  await handleToggleVisibility(detailReview)
                  setDetailReview(null)
                }}
              >
                {detailReview.status === 'hidden' ? '노출 상태로 변경' : '숨김 처리하기'}
              </button>
              <button
                type="button"
                className={styles.actionDeleteBtn}
                onClick={() => {
                  setDeleteConfirmId(detailReview.id)
                  setDetailReview(null)
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
            <h4>리뷰 삭제 확인</h4>
            <p>이 리뷰를 삭제하시겠습니까?<br />삭제된 리뷰는 복구할 수 없습니다.</p>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.ghostBtn} onClick={() => setDeleteConfirmId(null)}>취소</button>
              <button type="button" className={styles.dangerBtn} onClick={handleConfirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReviewManager