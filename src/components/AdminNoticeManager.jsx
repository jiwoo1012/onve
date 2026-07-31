import { useEffect, useState, useMemo } from 'react'
import { createNotice, deleteNotice, getNotices, updateNotice } from '../firebase/noticeApi'
import styles from './AdminNoticeManager.module.scss'

const NOTICE_CATEGORIES = [
  { label: '공지사항', value: '공지' },
  { label: '소식', value: '소식' },
  { label: '안내', value: '안내' },
  { label: '이벤트', value: '이벤트' },
  { label: '점검', value: '점검' },
]

const initialNotice = {
  category: '공지',
  title: '',
  content: '',
  isPinned: false,
  status: 'active',
}

const formatDate = (dateInput) => {
  let date = null
  if (typeof dateInput?.toDate === 'function') {
    date = dateInput.toDate()
  } else if (dateInput instanceof Date) {
    date = dateInput
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput)
  }

  if (!date || Number.isNaN(date.getTime())) date = new Date()

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const AdminNoticeManager = () => {
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState(initialNotice)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [errors, setErrors] = useState({})
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedSalesStatus] = useState('all')

  const [detailNotice, setDetailNotice] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 3500)
  }

  const loadNotices = async () => {
    setIsLoading(true)
    try {
      const data = await getNotices()
      setNotices(data)
    } catch (e) {
      console.error(e)
      showToast('공지사항을 불러오지 못했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = '제목을 입력해주세요.'
    if (!form.content.trim()) newErrors.content = '공지 내용을 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    const payload = {
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      isPinned: Boolean(form.isPinned),
      status: form.status,
    }

    try {
      if (editingId) {
        await updateNotice(editingId, payload)
        showToast('공지사항이 수정되었습니다.')
      } else {
        await createNotice({ ...payload, createdAt: new Date() })
        showToast('신규 공지사항이 등록되었습니다.')
      }
      handleCancelForm()
      await loadNotices()
    } catch (error) {
      console.error(error)
      showToast('공지사항 저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelForm = () => {
    setEditingId(null)
    setForm(initialNotice)
    setErrors({})
    setIsFormOpen(false)
  }

  const handleStartEdit = (notice) => {
    setEditingId(notice.id)
    setForm({
      category: notice.category || '공지',
      title: notice.title || '',
      content: notice.content || '',
      isPinned: Boolean(notice.isPinned),
      status: notice.status || 'active',
    })
    setErrors({})
    setIsFormOpen(true)
    window.scrollTo({ top: 100, behavior: 'smooth' })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteNotice(deleteConfirmId)
      setNotices((prev) => prev.filter((item) => item.id !== deleteConfirmId))
      showToast('공지사항이 삭제되었습니다.')
    } catch (error) {
      console.error(error)
      showToast('공지사항 삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const filteredNotices = useMemo(() => {
    return notices
      .filter((item) => {
        if (searchTerm.trim() && !item.title.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
          return false
        }
        if (selectedCategory !== 'all') {
          const itemCat = item.category || '공지'
          if (selectedCategory === '공지' || selectedCategory === '공지사항') {
            if (itemCat !== '공지' && itemCat !== '공지사항') return false
          } else if (itemCat !== selectedCategory) {
            return false
          }
        }
        if (selectedStatus !== 'all' && (item.status || 'active') !== selectedStatus) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1
        }
        const dateA = a.createdAt?.toDate?.() || (a.createdAt ? new Date(a.createdAt) : 0)
        const dateB = b.createdAt?.toDate?.() || (b.createdAt ? new Date(b.createdAt) : 0)
        return dateB - dateA
      })
  }, [notices, searchTerm, selectedCategory, selectedStatus])

  return (
    <div className={styles.manager}>
      {toastMessage.text && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.text}
        </div>
      )}

      {/* 1. 공지 등록 / 수정 폼 */}
      {isFormOpen && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formCardHeader}>
            <h4>{editingId ? '공지사항 수정' : '새 공지 등록'}</h4>
            <button type="button" className={styles.closeFormBtn} onClick={handleCancelForm}>✕ 닫기</button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldItem}>
              <label>
                공지 유형 <span className={styles.required}>*</span>
              </label>
              {/* name="category" 가 정상 추가된 셀렉트 태그 */}
              <select
                name="category"
                className={styles.styledInput}
                value={form.category}
                onChange={handleInputChange}
              >
                {NOTICE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldItem}>
              <label>노출 상태</label>
              <select
                name="status"
                className={styles.styledInput}
                value={form.status}
                onChange={handleInputChange}
              >
                <option value="active">게시 중</option>
                <option value="hidden">숨김</option>
              </select>
            </div>

            <div className={`${styles.full} ${styles.fieldItem}`}>
              <div className={styles.labelRow}>
                <label>
                  제목 <span className={styles.required}>*</span>
                </label>
                <span className={styles.charCounter}>{form.title.length} / 80자</span>
              </div>
              <input
                name="title"
                maxLength={80}
                className={styles.styledInput}
                value={form.title}
                onChange={handleInputChange}
                placeholder="공지사항 제목을 입력하세요."
              />
              {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
            </div>

            <div className={`${styles.full} ${styles.fieldItem}`}>
              <div className={styles.labelRow}>
                <label>
                  내용 <span className={styles.required}>*</span>
                </label>
                <span className={styles.charCounter}>{form.content.length} / 2,000자</span>
              </div>
              <textarea
                name="content"
                maxLength={2000}
                className={styles.styledInput}
                value={form.content}
                onChange={handleInputChange}
                placeholder="공지사항 상세 내용을 입력하세요."
              />
              {errors.content && <span className={styles.fieldError}>{errors.content}</span>}
            </div>

            <div className={`${styles.full} ${styles.pinCheckCard}`}>
              <label className={styles.pinCheckLabel}>
                <input
                  name="isPinned"
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={handleInputChange}
                />
                <div className={styles.pinCheckText}>
                  <strong>📌 중요 공지로 상단 고정</strong>
                  <span>목록 최상단에 상시 노출되어 고객이 우선적으로 확인할 수 있습니다.</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.formFooterButtons}>
            <button type="button" className={styles.ghostButton} onClick={handleCancelForm}>
              {editingId ? '수정 취소' : '초기화'}
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              {isSaving ? '등록 중...' : editingId ? '변경사항 저장' : '공지 등록'}
            </button>
          </div>
        </form>
      )}

      {/* 2. 등록된 공지 목록 */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <div>
            <h3>등록된 공지</h3>
            <p className={styles.subGuide}>총 {notices.length}건 중 {filteredNotices.length}건 표시</p>
          </div>
          
          <div className={styles.listHeaderRight}>
            <span className={styles.totalBadge}>총 {filteredNotices.length}건</span>
            {!isFormOpen && (
              <button
                type="button"
                className={styles.openFormBtn}
                onClick={() => {
                  setForm(initialNotice)
                  setEditingId(null)
                  setIsFormOpen(true)
                }}
              >
                + 새 공지 등록
              </button>
            )}
          </div>
        </div>

        {/* 필터 & 검색 툴바 */}
        <div className={styles.filterToolbar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="공지 제목 검색..."
              className={styles.styledInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')}>✕</button>}
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.styledInput}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">전체 유형</option>
              {NOTICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              className={styles.styledInput}
              value={selectedStatus}
              onChange={(e) => setSelectedSalesStatus(e.target.value)}
            >
              <option value="all">전체 상태</option>
              <option value="active">게시 중</option>
              <option value="hidden">숨김</option>
            </select>
          </div>
        </div>

        {/* 공지사항 테이블 */}
        {isLoading ? (
          <p className={styles.loadingText}>공지사항을 불러오는 중입니다...</p>
        ) : filteredNotices.length === 0 ? (
          <p className={styles.emptyText}>등록되거나 검색된 공지사항이 없습니다.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.noticeTable}>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>공지 유형</th>
                  <th>제목 및 내용 요약</th>
                  <th style={{ width: '90px' }}>노출 상태</th>
                  <th style={{ width: '100px' }}>작성일</th>
                  <th style={{ width: '110px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((notice) => (
                  <tr
                    key={notice.id}
                    className={`${editingId === notice.id ? styles.editingRow : ''} ${notice.isPinned ? styles.pinnedRow : ''}`}
                  >
                    <td>
                      <span className={`${styles.categoryBadge} ${styles[`cat_${notice.category}`]}`}>
                        {notice.category || '공지'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.titleContentCell}>
                        <div
                          className={styles.noticeTitleRow}
                          onClick={() => setDetailNotice(notice)}
                        >
                          {notice.isPinned && <span className={styles.pinIcon}>📌</span>}
                          <strong className={styles.clickableTitle}>{notice.title}</strong>
                          {editingId === notice.id && <span className={styles.editingBadge}>수정 중</span>}
                        </div>
                        <p className={styles.contentPreview}>{notice.content}</p>
                      </div>
                    </td>
                    <td>
                      <span className={notice.status === 'hidden' ? styles.statusHidden : styles.statusActive}>
                        {notice.status === 'hidden' ? '숨김' : '게시 중'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>{formatDate(notice.createdAt)}</span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => handleStartEdit(notice)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => setDeleteConfirmId(notice.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {detailNotice && (
        <div className={styles.modalBackdrop} onClick={() => setDetailNotice(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <span className={`${styles.categoryBadge} ${styles[`cat_${detailNotice.category}`]}`}>
                  {detailNotice.category || '공지'}
                </span>
                <h4>{detailNotice.title}</h4>
              </div>
              <button type="button" onClick={() => setDetailNotice(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalMetaRow}>
                <span>작성일: {formatDate(detailNotice.createdAt)}</span>
                <span>상태: {detailNotice.status === 'hidden' ? '숨김' : '게시 중'}</span>
                {detailNotice.isPinned && <span className={styles.pinMeta}>📌 상단 고정 공지</span>}
              </div>
              <div className={styles.modalContentBox}>
                {detailNotice.content}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  handleStartEdit(detailNotice)
                  setDetailNotice(null)
                }}
              >
                이 공지 수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
            <h4>공지사항 삭제 확인</h4>
            <p>선택한 공지사항을 삭제하시겠습니까?<br />삭제한 공지는 복구할 수 없습니다.</p>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.ghostButton} onClick={() => setDeleteConfirmId(null)}>취소</button>
              <button type="button" className={styles.dangerButton} onClick={handleConfirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNoticeManager
