import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { getAllUserProfiles } from '../firebase/userApi'
import { auth, db } from '../firebase/firebase'
import { getProducts } from '../firebase/productApi'
import { getAllReviews } from '../firebase/reviewApi'
import AdminProductManager from '../components/AdminProductManager'
import AdminNoticeManager from '../components/AdminNoticeManager'
import AdminRecommendationManager from '../components/AdminRecommendationManager'
import AdminReviewManager from '../components/AdminReviewManager'
import CategoryStockChart from '../components/CategoryStockChart'
import styles from './Admin.module.scss'

const LOW_STOCK_THRESHOLD = 5

const adminMenus = [
  { path: '/admin', label: '대시보드', title: '관리자 대시보드', description: '쇼핑몰의 주요 운영 현황과 실시간 데이터를 종합적으로 확인합니다.' },
  { path: '/admin/members', label: '회원 관리', title: '회원 관리', description: '가입한 회원 목록 및 계정 현황을 관리합니다.' },
  { path: '/admin/products', label: '상품 관리', title: '상품 관리 · 재고 관리', description: '상품 등록, 가격 및 재고 수량을 통합 관리합니다.' },
  { path: '/admin/recommendations', label: '추천 상품 관리', title: '추천 상품 관리', description: '메인 화면에 노출될 추천 상품(최대 5개)을 설정합니다.' },
  { path: '/admin/notices', label: '공지사항 관리', title: '공지사항 관리', description: '쇼핑몰 주요 공지사항 및 안내를 관리합니다.' },
  { path: '/admin/reviews', label: '리뷰 관리', title: '리뷰 관리', description: '등록된 전체 고객 리뷰를 상품별로 조회하고 관리합니다.' },
]

const formatJoinedAt = (createdAt) => {
  const date = createdAt?.toDate?.() || (createdAt ? new Date(createdAt) : null)
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-'

  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

const getMemberDateValue = (createdAt) => {
  const date = createdAt?.toDate?.() || (createdAt ? new Date(createdAt) : null)
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

const maskEmail = (email = '') => {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '-'
  return `${localPart.slice(0, Math.min(5, localPart.length))}***@${domain}`
}

const formatDateShort = (dateInput) => {
  const date = dateInput?.toDate?.() || (dateInput ? new Date(dateInput) : null)
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price || 0)
}

const formatLastUpdated = (date) => {
  if (!date) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

const getStockBadgeClass = (stock) => {
  if (stock === 0) return styles.badgeSoldOut
  if (stock <= 2) return styles.badgeImminent
  return styles.badgeLowStock
}

const getStockBadgeLabel = (stock) => {
  if (stock === 0) return '품절'
  if (stock <= 2) return '품절 임박'
  return '재고 부족'
}

const Admin = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const currentMenu = adminMenus.find((menu) => menu.path === pathname) || adminMenus[0]

  const [members, setMembers] = useState([])
  const [isMembersLoading, setIsMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [memberStatusFilter, setMemberStatusFilter] = useState('all')
  const [memberSort, setMemberSort] = useState('newest')
  const [memberPage, setMemberPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberStatusChangingId, setMemberStatusChangingId] = useState(null)

  // 대시보드용 데이터
  const [dashboard, setDashboard] = useState({
    memberCount: 0,
    newMembersThisMonth: 0,
    productCount: 0,
    reviewCount: 0,
    newReviewsThisWeek: 0,
    lowStockProducts: [],
    recommendedProducts: [],
    products: [],
    recentReviews: [],
  })
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadMembers = useCallback(async () => {
    setIsMembersLoading(true)
    setMembersError('')

    try {
      setMembers(await getAllUserProfiles())
    } catch (error) {
      console.error(error)
      setMembersError('회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsMembersLoading(false)
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    setIsDashboardLoading(true)
    setDashboardError('')

    try {
      const [userProfiles, products, reviews] = await Promise.all([
        getAllUserProfiles(),
        getProducts(),
        getAllReviews(),
      ])

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // 신규 회원 계산 (이번 달)
      const newMembersThisMonth = userProfiles.filter((user) => {
        const joinedDate = user.createdAt?.toDate?.() || (user.createdAt ? new Date(user.createdAt) : null)
        return joinedDate && joinedDate >= firstDayOfMonth
      }).length

      // 신규 리뷰 계산 (지난주 대비/지난 7일간)
      const newReviewsThisWeek = reviews.filter((review) => {
        const revDate = review.createdAt?.toDate?.() || (review.createdAt ? new Date(review.createdAt) : null)
        return revDate && revDate >= oneWeekAgo
      }).length

      // 재고 부족 상품 (5개 이하)
      const lowStockProducts = products
        .filter((product) => Number(product.stock) <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => Number(a.stock) - Number(b.stock))

      // 추천 상품 리스트
      const recommendedProducts = products.filter((product) => product.isRecommended)

      // 최근 등록된 리뷰 3개
      const sortedReviews = [...reviews].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || (a.createdAt ? new Date(a.createdAt) : 0)
        const dateB = b.createdAt?.toDate?.() || (b.createdAt ? new Date(b.createdAt) : 0)
        return dateB - dateA
      })
      const recentReviews = sortedReviews.slice(0, 3)

      setDashboard({
        memberCount: userProfiles.length,
        newMembersThisMonth,
        productCount: products.length,
        reviewCount: reviews.length,
        newReviewsThisWeek,
        lowStockProducts,
        recommendedProducts,
        products,
        recentReviews,
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error(error)
      setDashboardError('대시보드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsDashboardLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pathname === '/admin/members') {
      loadMembers()
    } else if (pathname === '/admin') {
      loadDashboard()
    }
  }, [pathname, loadMembers, loadDashboard])

  useEffect(() => {
    setMemberPage(1)
  }, [memberSearch, memberRoleFilter, memberStatusFilter, memberSort])

  const memberSummary = useMemo(() => ({
    total: members.length,
    users: members.filter((member) => member.role !== 'admin').length,
    admins: members.filter((member) => member.role === 'admin').length,
  }), [members])

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase()
    return members.filter((member) => {
      const isAdmin = member.role === 'admin'
      const isSuspended = member.status === 'suspended'
      const matchesSearch = !keyword || member.nickname?.toLowerCase().includes(keyword) || member.email?.toLowerCase().includes(keyword)
      const matchesRole = memberRoleFilter === 'all' || (memberRoleFilter === 'admin' ? isAdmin : !isAdmin)
      const matchesStatus = memberStatusFilter === 'all' || (memberStatusFilter === 'suspended' ? isSuspended : !isSuspended)
      return matchesSearch && matchesRole && matchesStatus
    }).sort((a, b) => {
      if (memberSort === 'oldest') return getMemberDateValue(a.createdAt) - getMemberDateValue(b.createdAt)
      if (memberSort === 'name') return (a.nickname || '').localeCompare(b.nickname || '', 'ko')
      return getMemberDateValue(b.createdAt) - getMemberDateValue(a.createdAt)
    })
  }, [members, memberSearch, memberRoleFilter, memberStatusFilter, memberSort])

  const memberPageSize = 10
  const memberTotalPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize))
  const pagedMembers = filteredMembers.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize)

  useEffect(() => {
    if (memberPage > memberTotalPages) setMemberPage(memberTotalPages)
  }, [memberPage, memberTotalPages])

  const handleMemberStatusChange = async (member) => {
    if (member.id === auth.currentUser?.uid) return
    const nextStatus = member.status === 'suspended' ? 'active' : 'suspended'
    setMemberStatusChangingId(member.id)
    try {
      await updateDoc(doc(db, 'users', member.id), { status: nextStatus })
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, status: nextStatus } : item))
      setSelectedMember((current) => current?.id === member.id ? { ...current, status: nextStatus } : current)
    } catch (error) {
      console.error(error)
      setMembersError('회원 상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setMemberStatusChangingId(null)
    }
  }

  const handleGoToLowStock = () => {
    navigate('/admin/products', { state: { filter: 'stock:lowStock' } })
  }

  const handleEditProduct = (product) => {
    navigate('/admin/products', { state: { editProduct: product } })
  }

  return (
    <section className={styles.admin}>
      <aside className={styles.sidebar}>
        <img src="/img/logo-05.png" alt="ADMIN" className={styles.eyebrow} />
        <h1>관리자 페이지</h1>
        <nav className={styles.menu}>
          {adminMenus.map((menu) => (
            <Link key={menu.path} to={menu.path} className={pathname === menu.path ? styles.active : ''}>
              {menu.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        <div className={styles.headerArea}>
          <div>
            <p className={styles.eyebrowText}>ADMIN MENU</p>
            <h2>{currentMenu.title}</h2>
            <p className={styles.menuDescription}>{currentMenu.description}</p>
          </div>

          {pathname === '/admin' && (
            <div className={styles.refreshBox}>
              <span className={styles.lastUpdatedText}>
                최근 업데이트 {formatLastUpdated(lastUpdated)}
              </span>
              <button 
                type="button" 
                className={styles.refreshButton}
                onClick={loadDashboard}
                disabled={isDashboardLoading}
              >
                <svg className={`${styles.refreshIcon} ${isDashboardLoading ? styles.spin : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                새로고침
              </button>
            </div>
          )}
        </div>

        {pathname === '/admin' ? (
          <div className={styles.dashboard}>
            {isDashboardLoading && !lastUpdated && <p className={styles.loadingText}>운영 현황을 불러오는 중입니다...</p>}
            {dashboardError && <p className={styles.errorMessage}>{dashboardError}</p>}

            {(!isDashboardLoading || lastUpdated) && !dashboardError && (
              <>
                {/* 1. 요약 카드 4종 */}
                <div className={styles.statGrid}>
                  {/* 총 회원 수 */}
                  <div className={styles.statCard} onClick={() => navigate('/admin/members')} role="button" tabIndex={0}>
                    <div className={styles.statCardHeader}>
                      <span className={styles.statLabel}>총 회원 수</span>
                    </div>
                    <div className={styles.statValueGroup}>
                      <strong className={styles.statValue}>{dashboard.memberCount}</strong>
                      <span className={styles.statUnit}>명</span>
                    </div>
                    <div className={styles.statMeta}>
                      <span className={styles.trendUp}>이번 달 +{dashboard.newMembersThisMonth}명</span>
                    </div>
                    <div className={styles.cardLink}>회원 목록 보기 &rarr;</div>
                  </div>

                  {/* 총 상품 수 */}
                  <div className={styles.statCard} onClick={() => navigate('/admin/products')} role="button" tabIndex={0}>
                    <div className={styles.statCardHeader}>
                      <span className={styles.statLabel}>총 상품 수</span>
                    </div>
                    <div className={styles.statValueGroup}>
                      <strong className={styles.statValue}>{dashboard.productCount}</strong>
                      <span className={styles.statUnit}>개</span>
                    </div>
                    <div className={styles.statMeta}>
                      <span className={styles.metaText}>카테고리별 정상 등록됨</span>
                    </div>
                    <div className={styles.cardLink}>상품 관리하기 &rarr;</div>
                  </div>

                  {/* 재고 부족 상품 */}
                  <div 
                    className={`${styles.statCard} ${dashboard.lowStockProducts.length > 0 ? styles.statCardWarning : ''}`}
                    onClick={handleGoToLowStock}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.statCardHeader}>
                      <span className={styles.statLabel}>재고 부족</span>
                      {dashboard.lowStockProducts.length > 0 && (
                        <span className={styles.warningBadge}>
                          <span className={styles.warningDot}></span> 확인 필요
                        </span>
                      )}
                    </div>
                    <div className={styles.statValueGroup}>
                      <strong className={`${styles.statValue} ${dashboard.lowStockProducts.length > 0 ? styles.statValueAlert : ''}`}>
                        {dashboard.lowStockProducts.length}
                      </strong>
                      <span className={styles.statUnit}>개</span>
                    </div>
                    <div className={styles.statMeta}>
                      <span className={dashboard.lowStockProducts.length > 0 ? styles.trendAlert : styles.metaText}>
                        {dashboard.lowStockProducts.length > 0 ? '재고 5개 이하 상품 존재' : '모든 상품 재고 충분'}
                      </span>
                    </div>
                    <div className={styles.cardLink}>재고 확인하기 &rarr;</div>
                  </div>

                  {/* 등록된 리뷰 */}
                  <div className={styles.statCard} onClick={() => navigate('/admin/reviews')} role="button" tabIndex={0}>
                    <div className={styles.statCardHeader}>
                      <span className={styles.statLabel}>등록된 리뷰</span>
                    </div>
                    <div className={styles.statValueGroup}>
                      <strong className={styles.statValue}>{dashboard.reviewCount}</strong>
                      <span className={styles.statUnit}>개</span>
                    </div>
                    <div className={styles.statMeta}>
                      <span className={styles.trendUp}>최근 7일간 +{dashboard.newReviewsThisWeek}개</span>
                    </div>
                    <div className={styles.cardLink}>리뷰 확인하기 &rarr;</div>
                  </div>
                </div>

                {/* 2. 카테고리별 상품 분포 차트 */}
                <CategoryStockChart products={dashboard.products} />

                {/* 3. 추천 상품 현황 섹션 */}
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>추천 상품 현황</h3>
                      <p className={styles.panelSubText}>메인 페이지에 우선 노출되는 추천 상품 등록 상태입니다.</p>
                    </div>
                    <Link to="/admin/recommendations" className={styles.panelActionBtn}>
                      추천 상품 관리 &rarr;
                    </Link>
                  </div>

                  <div className={styles.recommendProgressBox}>
                    <div className={styles.progressLabelRow}>
                      <span className={styles.progressTitle}>
                        현재 등록: <strong>{dashboard.recommendedProducts.length}</strong> / 5개
                      </span>
                      <span className={styles.progressStatusText}>
                        {dashboard.recommendedProducts.length >= 5 ? '추천 한도 도달 (최대 5개)' : `여유 ${5 - dashboard.recommendedProducts.length}개 추가 가능`}
                      </span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div 
                        className={styles.progressBarFill} 
                        style={{ width: `${(dashboard.recommendedProducts.length / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {dashboard.recommendedProducts.length > 0 && (
                    <div className={styles.recommendedMiniGrid}>
                      {dashboard.recommendedProducts.map((item) => (
                        <div key={item.id} className={styles.recMiniCard}>
                          <img src={item.image} alt={item.name} className={styles.recMiniThumb} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          <div className={styles.recMiniInfo}>
                            <span className={styles.recMiniName}>{item.name}</span>
                            <span className={styles.recMiniPrice}>{formatPrice(item.price)}원</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. 재고 부족 상세 목록 */}
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>재고 부족 상품</h3>
                      <p className={styles.panelSubText}>재고가 5개 이하인 상품을 즉시 확인하고 수량을 관리하세요.</p>
                    </div>
                    {dashboard.lowStockProducts.length > 0 && (
                      <span className={styles.totalLowBadge}>총 {dashboard.lowStockProducts.length}건</span>
                    )}
                  </div>

                  {dashboard.lowStockProducts.length === 0 ? (
                    <div className={styles.panelEmptyBox}>
                      <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <p className={styles.panelEmpty}>현재 재고 부족 상품이 없습니다. 수량이 모두 안정적입니다.</p>
                    </div>
                  ) : (
                    <div className={styles.lowStockTableWrap}>
                      <div className={styles.lowStockTableHead}>
                        <span>상품 정보</span>
                        <span>카테고리 / 가격</span>
                        <span>현재 재고</span>
                        <span>상태</span>
                        <span>관리</span>
                      </div>
                      <ul className={styles.lowStockRichList}>
                        {dashboard.lowStockProducts.map((product) => (
                          <li key={product.id} className={styles.lowStockItem}>
                            <div className={styles.itemMainInfo}>
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className={styles.itemThumb} 
                                onError={(e) => { e.currentTarget.src = '' }} 
                              />
                              <div className={styles.itemNameGroup}>
                                <strong className={styles.itemName}>{product.name}</strong>
                                <span className={styles.itemSubCategory}>{product.categoryName || '미지정'}</span>
                              </div>
                            </div>

                            <div className={styles.itemPriceGroup}>
                              <span className={styles.itemCategoryBadge}>{product.categoryName || '미지정'}</span>
                              <span className={styles.itemPrice}>{formatPrice(product.price)}원</span>
                            </div>

                            <div className={styles.itemStockGroup}>
                              <span className={styles.stockCountText}>재고 <strong>{product.stock}</strong>개</span>
                            </div>

                            <div className={styles.itemStatusGroup}>
                              <span className={`${styles.statusBadge} ${getStockBadgeClass(Number(product.stock))}`}>
                                {getStockBadgeLabel(Number(product.stock))}
                              </span>
                            </div>

                            <div className={styles.itemActionGroup}>
                              <button 
                                type="button" 
                                className={styles.tableActionBtn}
                                onClick={() => handleEditProduct(product)}
                              >
                                상품 수정
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 5. 최근 활동 */}
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>최근 활동</h3>
                      <p className={styles.panelSubText}>고객이 가장 최근에 등록한 리뷰 소식입니다.</p>
                    </div>
                    <Link to="/admin/reviews" className={styles.panelActionBtn}>
                      전체 리뷰 보기 &rarr;
                    </Link>
                  </div>

                  {dashboard.recentReviews.length === 0 ? (
                    <p className={styles.panelEmpty}>등록된 최근 활동 내역이 없습니다.</p>
                  ) : (
                    <ul className={styles.activityList}>
                      {dashboard.recentReviews.map((review) => (
                        <li key={review.id} className={styles.activityItem}>
                          <div className={styles.activityIconBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <div className={styles.activityBody}>
                            <p className={styles.activityText}>
                              <strong>{review.userName || review.userEmail || '고객'}</strong>님이 
                              <span className={styles.activityProduct}> [{review.productName || '상품'}]</span>에 새로운 리뷰를 등록했습니다.
                            </p>
                            <p className={styles.activityContentPreview}>"{review.content}"</p>
                          </div>
                          <span className={styles.activityDate}>{formatDateShort(review.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        ) : pathname === '/admin/members' ? (
          <div className={`${styles.panel} ${styles.memberPanel}`}>
            {isMembersLoading && <p className={styles.loadingText}>회원 목록을 불러오는 중입니다...</p>}
            {membersError && <p className={styles.errorMessage}>{membersError}</p>}
            {!isMembersLoading && !membersError && (
              <>
                <div className={styles.memberSummary}>
                  <span className={styles.memberSummaryChip}>전체 회원 <strong>{memberSummary.total}명</strong></span>
                  <span className={styles.memberSummaryChip}>일반 회원 <strong>{memberSummary.users}명</strong></span>
                  <span className={`${styles.memberSummaryChip} ${styles.adminSummaryChip}`}>관리자 <strong>{memberSummary.admins}명</strong></span>
                </div>
                <div className={styles.memberToolbar}>
                  <input type="search" className={styles.memberSearch} placeholder="닉네임 또는 이메일 검색" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} />
                  <div className={styles.memberFilters}>
                    <select value={memberRoleFilter} onChange={(event) => setMemberRoleFilter(event.target.value)}><option value="all">전체 권한</option><option value="user">일반 회원</option><option value="admin">관리자</option></select>
                    <select value={memberStatusFilter} onChange={(event) => setMemberStatusFilter(event.target.value)}><option value="all">전체 상태</option><option value="active">정상</option><option value="suspended">이용 정지</option></select>
                    <select value={memberSort} onChange={(event) => setMemberSort(event.target.value)}><option value="newest">최신 가입순</option><option value="oldest">오래된순</option><option value="name">닉네임순</option></select>
                  </div>
                </div>
              <div className={styles.memberTableWrap}>
                <table className={styles.memberTable}>
                  <thead><tr><th>회원 정보</th><th>권한</th><th>상태</th><th>가입일</th><th>관리</th></tr></thead>
                  <tbody>
                    {pagedMembers.map((member) => {
                      const isAdmin = member.role === 'admin'
                      const isSuspended = member.status === 'suspended'
                      const isCurrentAdmin = member.id === auth.currentUser?.uid
                      return (
                      <tr key={member.id}>
                        <td><div className={styles.memberIdentity}><span className={styles.memberAvatar}>{(member.nickname || member.email || '?').trim().charAt(0).toUpperCase()}</span><div><strong>{member.nickname || '-'}</strong><span>{maskEmail(member.email)}</span></div></div></td>
                        <td><span className={isAdmin ? styles.roleAdmin : styles.roleUser}>{isAdmin ? '관리자' : '일반 회원'}</span></td>
                        <td><span className={isSuspended ? styles.statusSuspended : styles.statusActive}>{isSuspended ? '이용 정지' : '정상'}</span></td>
                        <td>{formatJoinedAt(member.createdAt)}</td>
                        <td><div className={styles.memberActions}><button type="button" className={styles.memberDetailButton} onClick={() => setSelectedMember(member)}>상세보기</button><button type="button" className={styles.memberStatusButton} onClick={() => handleMemberStatusChange(member)} disabled={isCurrentAdmin || memberStatusChangingId === member.id}>{memberStatusChangingId === member.id ? '변경 중...' : isSuspended ? '정상 전환' : '상태 변경'}</button></div></td>
                      </tr>
                    )})}
                    {filteredMembers.length === 0 && <tr><td colSpan="5" className={styles.memberEmpty}>조건에 맞는 회원이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
              {memberTotalPages > 1 && <div className={styles.memberPagination}>{Array.from({ length: memberTotalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={page === memberPage ? styles.memberPageActive : ''} onClick={() => setMemberPage(page)}>{page}</button>)}</div>}
              </>
            )}
            {selectedMember && <div className={styles.memberModalBackdrop} onClick={() => setSelectedMember(null)}><div className={styles.memberModal} onClick={(event) => event.stopPropagation()}><div className={styles.memberModalHeader}><h3>회원 상세 정보</h3><button type="button" onClick={() => setSelectedMember(null)}>×</button></div><dl className={styles.memberDetailList}><div><dt>닉네임</dt><dd>{selectedMember.nickname || '-'}</dd></div><div><dt>이메일</dt><dd>{selectedMember.email || '-'}</dd></div><div><dt>UID</dt><dd>{selectedMember.id}</dd></div><div><dt>가입일</dt><dd>{formatJoinedAt(selectedMember.createdAt)}</dd></div><div><dt>권한</dt><dd>{selectedMember.role === 'admin' ? '관리자' : '일반 회원'}</dd></div><div><dt>상태</dt><dd>{selectedMember.status === 'suspended' ? '이용 정지' : '정상'}</dd></div></dl><div className={styles.memberModalFooter}><button type="button" className={styles.memberStatusButton} onClick={() => handleMemberStatusChange(selectedMember)} disabled={selectedMember.id === auth.currentUser?.uid || memberStatusChangingId === selectedMember.id}>{selectedMember.id === auth.currentUser?.uid ? '본인 계정은 변경할 수 없습니다' : selectedMember.status === 'suspended' ? '정상 상태로 전환' : '이용 정지 처리'}</button></div></div></div>}
          </div>
        ) : pathname === '/admin/products' ? (
          <div className={styles.panel}><AdminProductManager /></div>
        ) : pathname === '/admin/notices' ? (
          <div className={styles.panel}><AdminNoticeManager /></div>
        ) : pathname === '/admin/recommendations' ? (
          <div className={styles.panel}><AdminRecommendationManager /></div>
        ) : pathname === '/admin/reviews' ? (
          <div className={styles.panel}><AdminReviewManager /></div>
        ) : (
          <div className={styles.panel}>
            <p>{currentMenu.description}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Admin
