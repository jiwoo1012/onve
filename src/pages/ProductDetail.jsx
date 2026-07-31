import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QuantityControl from '../components/QuantityControl'
import { getProductById } from '../firebase/productApi'
import useAuthStore from '../store/authStore'
import useReviewStore from '../store/useReviewStore'
import styles from './ProductDetail.module.scss'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)

  // 선택된 메인 이미지 관리
  const [selectedImage, setSelectedImage] = useState('')
  // 하단 탭 관리 ('info' | 'delivery' | 'review')
  const [activeTab, setActiveTab] = useState('info')

  // 스크롤 시 하단 고정 CTA 바 노출 여부
  const [showStickyBar, setShowStickyBar] = useState(false)

  const reviews = useReviewStore((state) => state.reviews)
  const fetchByProductId = useReviewStore((state) => state.fetchByProductId)
  const addReview = useReviewStore((state) => state.add)
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)

  const [newRating, setNewRating] = useState(5)
  const [newContent, setNewContent] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProductById(id)
        setProduct(data)
        if (data?.image) {
          setSelectedImage(data.image)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProduct()
  }, [id])

  useEffect(() => { fetchByProductId(id) }, [id, fetchByProductId])

  // 스크롤 감지 이벤트 (상단 버튼 영역 지날 때 Sticky Bar 노출)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 550) {
        setShowStickyBar(true)
      } else {
        setShowStickyBar(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (isLoading) return <div className={styles.loading}>상품을 불러오는 중입니다.</div>
  if (!product) return <section className={styles.notFound}><p>상품을 찾을 수 없습니다.</p><Link to="/products">상품 목록으로 이동</Link></section>

  // 썸네일 3개 고정 배열
  const rawImages = product.images && product.images.length > 0 ? product.images : [product.image]
  const imageList = [
    rawImages[0] || product.image,
    rawImages[1] || rawImages[0] || product.image,
    rawImages[2] || rawImages[0] || product.image,
  ]

  // 가격 및 혜택 계산
  const discountPrice = product.price - (product.price * (product.discountRate || 0)) / 100
  const totalPrice = quantity * discountPrice
  const isSoldOut = Number(product.stock) <= 0

  const shippingFee = product.shippingFee ?? 3000
  const freeShippingMin = product.freeShippingMin ?? 50000
  const rewardRate = product.rewardRate ?? 0.01
  const rewardPoint = Math.floor(discountPrice * quantity * rewardRate)

  // ⭐ 현재 상품 ID에 해당하는 리뷰만 추출 ⭐
  const currentProductReviews = reviews
  const totalReviewCount = currentProductReviews.length

  const currentRating = totalReviewCount > 0
    ? (currentProductReviews.reduce((acc, cur) => acc + cur.rating, 0) / totalReviewCount)
    : (product.rating ?? 5.0)

  // 공통 찜하기 토글 (로그인 확인)
  const handleToggleLike = () => {
    if (!useAuthStore.getState().user) {
      alert('로그인 후 이용해주세요.')
      return
    }
    setIsLiked(!isLiked)
  }

  // 장바구니 담기 (로그인 확인)
  const addToCart = () => {
    if (!useAuthStore.getState().user) {
      alert('로그인 후 이용해주세요.')
      return
    }
    if (isSoldOut) return
    const savedCart = window.localStorage.getItem('cart')
    const cart = savedCart ? JSON.parse(savedCart) : []
    const foundItem = cart.find((item) => String(item.id) === String(product.id))
    const nextCart = foundItem
      ? cart.map((item) => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item)
      : [...cart, { ...product, price: discountPrice, quantity }]
    window.localStorage.setItem('cart', JSON.stringify(nextCart))
    alert('장바구니에 상품을 담았습니다.')
  }

  // 신규 리뷰 등록 핸들러 (비로그인 차단 + 현재 상품 ID 저장)
  const handleReviewSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      alert('로그인 후 리뷰를 작성할 수 있습니다.')
      return
    }

    if (!newContent.trim()) {
      alert('리뷰 내용을 입력해 주세요.')
      return
    }

    const isSaved = await addReview({
      productId: String(id), productName: product.name, authorUid: user.uid,
      author: profile?.nickname || user.displayName || user.email,
      rating: Number(newRating),
      content: newContent,
    })
    if (!isSaved) return
    setNewContent('')
    setNewRating(5)
    alert('리뷰가 성공적으로 등록되었습니다.')
  }

  return (
    <section className={styles.container}>
      <Link to="/products" className={styles.backLink}>&lt; 상품 목록으로 돌아가기</Link>
      
      {/* ===== 상단 메인 상품 구역 ===== */}
      <div className={styles.productArea}>
        <div className={styles.imageArea}>
          <div className={styles.mainImage}>
            <img src={selectedImage || product.image} alt={product.name} />
          </div>
          <div className={styles.thumbnailList}>
            {imageList.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.thumbBtn} ${selectedImage === img || (!selectedImage && idx === 0) ? styles.active : ''}`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img} alt={`${product.name} 썸네일 ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.infoArea}>
          <span className={styles.category}>{product.category}</span>
          <h2 className={styles.title}>{product.name}</h2>
          
          <div className={styles.ratingRow}>
            <span className={styles.star}>★</span>
            <strong className={styles.rating}>{currentRating.toFixed(1)}</strong>
            <span className={styles.reviewCount}>({totalReviewCount}개 리뷰)</span>
          </div>

          <p className={styles.description}>{product.description}</p>

          {product.features && product.features.length > 0 && (
            <div className={styles.featureTags}>
              {product.features.map((feat, idx) => (
                <span key={idx} className={styles.tag}>#{feat}</span>
              ))}
            </div>
          )}

          <div className={styles.priceArea}>
            {product.discountRate > 0 && (
              <div className={styles.discountRow}>
                <span className={styles.badge}>{product.discountRate}% OFF</span>
                <del>{product.price.toLocaleString()}원</del>
              </div>
            )}
            <strong className={styles.finalPrice}>{discountPrice.toLocaleString()}원</strong>
          </div>

          <div className={styles.infoTable}>
            <div className={styles.infoRow}>
              <span className={styles.label}>배송비</span>
              <span className={styles.value}>
                {shippingFee === 0 ? '무료배송' : `${shippingFee.toLocaleString()}원`}
                <small className={styles.subText}>
                  ({freeShippingMin.toLocaleString()}원 이상 구매 시 무료배송)
                </small>
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>적립금</span>
              <span className={styles.value}>
                {rewardPoint.toLocaleString()}P <small className={styles.subText}>({(rewardRate * 100).toFixed(0)}% 적립)</small>
              </span>
            </div>
          </div>

          <div className={styles.quantityArea}>
            <span className={styles.label}>수량</span>
            <div className={styles.controlBox}>
              <QuantityControl quantity={quantity} setQuantity={setQuantity} maxQuantity={product.stock} disabled={isSoldOut} />
              <small className={styles.stock}>{isSoldOut ? '품절' : `재고 ${product.stock}개`}</small>
            </div>
          </div>

          <div className={styles.totalArea}>
            <span>총 상품 금액</span>
            <h2 className={styles.totalPrice}>{totalPrice.toLocaleString()}원</h2>
          </div>

          <div className={styles.actionButtons}>
            <button 
              type="button" 
              className={`${styles.likeBtn} ${isLiked ? styles.active : ''}`} 
              onClick={handleToggleLike}
            >
              {isLiked ? '♥ 찜 완료' : '♡ 찜하기'}
            </button>
            <button type="button" className={styles.cartBtn} onClick={addToCart} disabled={isSoldOut}>
              {isSoldOut ? '품절' : '장바구니 담기'}
            </button>
            <button type="button" className={styles.buyBtn} disabled={isSoldOut}>바로 구매</button>
          </div>
        </div>
      </div>

      {/* ===== 하단 상세 정보 탭 구역 ===== */}
      <div className={styles.detailTabSection}>
        <div className={styles.tabHeader}>
          <button
            type="button"
            className={activeTab === 'info' ? styles.activeTab : ''}
            onClick={() => setActiveTab('info')}
          >
            상품 정보
          </button>
          <button
            type="button"
            className={activeTab === 'delivery' ? styles.activeTab : ''}
            onClick={() => setActiveTab('delivery')}
          >
            배송/교환/반품
          </button>
          <button
            type="button"
            className={activeTab === 'review' ? styles.activeTab : ''}
            onClick={() => setActiveTab('review')}
          >
            상품 리뷰 ({totalReviewCount})
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* 1. 상품 정보 탭 */}
          {activeTab === 'info' && (
            <div className={styles.infoTabContainer}>
              {product.detailImage && (
                <div className={styles.detailImageWrapper}>
                  <img src={product.detailImage} alt={`${product.name} 상세이미지`} />
                </div>
              )}

              <div className={styles.brandTemplate}>
                <div className={styles.brandHeader}>
                  <span className={styles.subTitle}>Science & Technology for Your Skin</span>
                  <h2>onve 프리미엄 뷰티 스파 가이드</h2>
                  <p>독자적인 기술력과 고기능성 성분으로 피부와 두피 본연의 건강함을 되찾아 드립니다.</p>
                </div>

                <div className={styles.promiseGrid}>
                  <div className={styles.promiseCard}>
                    <div className={styles.num}>01</div>
                    <h4>철저한 품질 관리</h4>
                    <p>모든 케어 디바이스 및 제품은 엄격한 품질 테스트 과정을 거쳐 배송됩니다.</p>
                  </div>
                  <div className={styles.promiseCard}>
                    <div className={styles.num}>02</div>
                    <h4>저자극 인체공학 설계</h4>
                    <p>매일 안심하고 사용할 수 있는 피부 저자극 소재 및 제형 설계 기술을 적용했습니다.</p>
                  </div>
                  <div className={styles.promiseCard}>
                    <div className={styles.num}>03</div>
                    <h4>1년 무상 A/S 보장</h4>
                    <p>onve의 디바이스 제품군 구매 시 구매일로부터 1년 무상 A/S 혜택을 제공합니다.</p>
                  </div>
                </div>

                <div className={styles.commonNoticeTable}>
                  <h3>제품 공통 규격 및 정보</h3>
                  <table>
                    <tbody>
                      <tr>
                        <th>제품명</th>
                        <td>{product.name}</td>
                        <th>카테고리</th>
                        <td>{product.category}</td>
                      </tr>
                      <tr>
                        <th>제조국</th>
                        <td>대한민국</td>
                        <th>사용 구분</th>
                        <td>스킨 & 바디 케어용</td>
                      </tr>
                      <tr>
                        <th>보관 방법</th>
                        <td colSpan="3">직사광선을 피하고 습기가 적은 서늘한 장소에 보관하십시오.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. 배송/교환/반품 탭 */}
          {activeTab === 'delivery' && (
            <div className={styles.deliveryTabContainer}>
              <h3>배송 및 교환/반품 안내</h3>
              <div className={styles.deliveryInfo}>
                <h4>배송 안내</h4>
                <ul>
                  <li>배송 방법: 한진택배</li>
                  <li>배송 지역: 전국 지역</li>
                  <li>배송 비용: 3,000원 (50,000원 이상 구매 시 무료배송)</li>
                  <li>배송 기간: 평일 기준 오후 2시 이전 결제 완료 시 당일 출고됩니다.</li>
                </ul>
                <h4>교환 및 반품 안내</h4>
                <ul>
                  <li>상품 수령 후 7일 이내에 신청 가능합니다.</li>
                  <li>단순 변심으로 인한 교환/반품 시 왕복 택배비(6,000원)는 고객 부담입니다.</li>
                  <li>제품 포장을 개봉하였거나 훼손되어 상품 가치가 상실된 경우 교환/반품이 불가합니다.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 3. 상품 리뷰 탭 */}
          {activeTab === 'review' && (
            <div className={styles.reviewTabContainer}>
              <div className={styles.reviewSummary}>
                <div className={styles.summaryText}>
                  <h3>고객 만족도 및 후기</h3>
                  <p>실제 구매한 고객님들이 남겨주신 솔직한 리뷰입니다.</p>
                </div>
                <div className={styles.scoreBox}>
                  <strong>★ {currentRating.toFixed(1)}</strong>
                  <span>전체 {totalReviewCount}개의 리뷰</span>
                </div>
              </div>

              {/* 리뷰 작성 폼 */}
              <div className={styles.reviewFormCard}>
                <h4>리뷰 작성하기</h4>
                
                {!user && (
                  <div className={styles.loginNoticeOverlay}>
                    <p>🔒 로그인한 회원만 리뷰를 작성할 수 있습니다.</p>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit}>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>작성자명</label>
                      <input
                        type="text"
                        placeholder="이름을 입력하세요"
                        value={profile?.nickname || user?.displayName || ''}
                        disabled
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>평점</label>
                      <select 
                        value={newRating} 
                        onChange={(e) => setNewRating(e.target.value)}
                        disabled={!user}
                      >
                        <option value="5">★★★★★ (5점)</option>
                        <option value="4">★★★★☆ (4점)</option>
                        <option value="3">★★★☆☆ (3점)</option>
                        <option value="2">★★☆☆☆ (2점)</option>
                        <option value="1">★☆☆☆☆ (1점)</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>리뷰 내용</label>
                    <textarea
                      rows="4"
                      placeholder={user ? "제품을 사용해보신 솔직한 후기를 남겨주세요." : "로그인 후 리뷰를 작성해 주세요."}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      disabled={!user}
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className={styles.submitReviewBtn}
                    disabled={!user}
                  >
                    리뷰 등록하기
                  </button>
                </form>
              </div>

              {/* 해당 상품의 리뷰 리스트만 출력 */}
              {currentProductReviews.length > 0 && (
                <div className={styles.reviewList}>
                  <h4>BEST 리뷰 TOP 3</h4>
                  {currentProductReviews.slice(0, 3).map((rev) => (
                    <div key={`best-${rev.id}`} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}><div className={styles.userInfo}><strong className={styles.author}>{rev.author}</strong><span className={styles.stars}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span></div></div>
                      <p className={styles.content}>{rev.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.reviewList}>
                <h4>상품 후기 목록 ({currentProductReviews.length})</h4>
                {currentProductReviews.map((rev) => (
                  <div key={rev.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.userInfo}>
                        <strong className={styles.author}>{rev.author}</strong>
                        <span className={styles.stars}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                      </div>
                      <span className={styles.date}>{rev.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '-'}</span>
                    </div>
                    <p className={styles.content}>{rev.content}</p>
                  </div>
                ))}
                {currentProductReviews.length === 0 && (
                  <p className={styles.emptyReviewNotice}>아직 등록된 후기가 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 스크롤 시 화면 하단 고정 Sticky CTA 바 ===== */}
      <div className={`${styles.stickyBar} ${showStickyBar ? styles.visible : ''}`}>
        <div className={styles.stickyBarInner}>
          <div className={styles.stickyProductInfo}>
            <img src={selectedImage || product.image} alt={product.name} />
            <div className={styles.stickyText}>
              <span className={styles.stickyTitle}>{product.name}</span>
              <strong className={styles.stickyPrice}>{totalPrice.toLocaleString()}원</strong>
            </div>
          </div>
          <div className={styles.stickyActionButtons}>
            <button 
              type="button" 
              className={`${styles.stickyLikeBtn} ${isLiked ? styles.active : ''}`}
              onClick={handleToggleLike}
            >
              {isLiked ? '♥ 찜 완료' : '♡ 찜하기'}
            </button>
            <button type="button" className={styles.stickyCartBtn} onClick={addToCart} disabled={isSoldOut}>
              장바구니
            </button>
            <button type="button" className={styles.stickyBuyBtn} disabled={isSoldOut}>
              바로 구매
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductDetail
