import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { onAuthStateChanged, signOut, updatePassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { createUserProfile, getUserProfile, updateUserNickname } from '../firebase/userApi'
import { getUserOrders } from '../firebase/orderApi'
import { loadLocal, saveLocal } from '../utils/localStorage'
import styles from './MyPage.module.scss'

const formatJoinedAt = (createdAt) => {
  const date = createdAt?.toDate?.() || createdAt
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const getRecentWishlistItems = (items) => items.slice(-3).reverse()

const MyPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [nickname, setNickname] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [orders, setOrders] = useState([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [isCartLoading, setIsCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [wishlistItems, setWishlistItems] = useState([])
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [wishlistError, setWishlistError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthChecked(true)
      if (!currentUser) navigate('/login')
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      setIsProfileLoading(true)
      setProfileError('')

      try {
        let userProfile

        try {
          userProfile = await getUserProfile(user.uid)
        } catch (error) {
          if (error.message !== 'user-not-found') throw error
          userProfile = await createUserProfile(user)
        }

        setProfile(userProfile)
        setNickname(userProfile.nickname || '')
      } catch (error) {
        console.error(error)
        setProfileError('회원 정보를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.')
      } finally {
        setIsProfileLoading(false)
      }
    }

    loadProfile()
  }, [user])

  useEffect(() => {
    if (!user) return

    const loadWishlistItems = async () => {
      setIsWishlistLoading(true)
      setWishlistError('')

      setWishlistItems(loadLocal('wishlist', []))
      setIsWishlistLoading(false)
    }

    loadWishlistItems()
  }, [user])

  useEffect(() => {
    if (!user) return

    const loadCartItems = async () => {
      setIsCartLoading(true)
      setCartError('')

      setCartItems(loadLocal('cart', []))
      setIsCartLoading(false)
    }

    loadCartItems()
  }, [user])

  useEffect(() => {
    if (!user) return

    const loadOrders = async () => {
      setIsOrdersLoading(true)
      setOrdersError('')

      try {
        setOrders(await getUserOrders(user.uid))
      } catch (error) {
        console.error(error)
        setOrdersError('주문 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      } finally {
        setIsOrdersLoading(false)
      }
    }

    loadOrders()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const handleCartItemDelete = async (itemId) => {
    if (!window.confirm('장바구니에서 이 상품을 삭제하시겠습니까?')) return

    try {
      const nextItems = cartItems.filter((item) => item.id !== itemId)
      saveLocal('cart', nextItems)
      setCartItems(nextItems)
    } catch (error) {
      console.error(error)
      setCartError('장바구니 상품을 삭제하지 못했습니다. 다시 시도해주세요.')
    }
  }

  const handleWishlistItemDelete = async (itemId) => {
    try {
      const nextItems = wishlistItems.filter((item) => item.id !== itemId)
      saveLocal('wishlist', nextItems)
      setWishlistItems(nextItems)
    } catch (error) {
      console.error(error)
      setWishlistError('찜한 상품을 삭제하지 못했습니다. 다시 시도해주세요.')
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSaveMessage('')

    if (!nickname.trim()) {
      setSaveMessage('닉네임을 입력해주세요.')
      return
    }

    if (newPassword && newPassword.length < 6) {
      setSaveMessage('비밀번호는 6자 이상 입력해주세요.')
      return
    }

    setIsSaving(true)

    try {
      const trimmedNickname = nickname.trim()
      if (trimmedNickname !== profile.nickname) {
        await updateUserNickname(user.uid, trimmedNickname)
        await updateProfile(user, { displayName: trimmedNickname })
        setProfile((currentProfile) => ({ ...currentProfile, nickname: trimmedNickname }))
      }

      if (newPassword) {
        await updatePassword(user, newPassword)
        setNewPassword('')
      }

      setSaveMessage('회원 정보가 수정되었습니다.')
    } catch (error) {
      console.error(error)
      setSaveMessage(
        error.code === 'auth/requires-recent-login'
          ? '보안을 위해 다시 로그인한 후 비밀번호를 변경해주세요.'
          : '회원 정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthChecked) return <p className={styles.loadingMessage}>인증 정보를 확인하는 중입니다.</p>
  if (!user) return null

  return (
    <section className={styles.myPage}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>MY PAGE</p>
        <h1>마이페이지</h1>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>{(profile?.nickname || user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}</div>
        <div className={styles.profileInfo}>
          <strong>{profile?.nickname || user.displayName || '회원'}님</strong>
          <span>{profile?.email || user.email}</span>
          <span>가입일 {formatJoinedAt(profile?.createdAt)}</span>
        </div>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>로그아웃</button>
      </div>

      {isProfileLoading && <p className={styles.profileLoading}>회원 정보를 불러오는 중입니다.</p>}
      {profileError && <p className={styles.profileError}>{profileError}</p>}

      {profile && (
        <section className={styles.profileEdit}>
          <h2>회원 정보 수정</h2>
          <form className={styles.profileForm} onSubmit={handleProfileSubmit}>
            <label>닉네임<input value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
            <label>이메일<input value={profile.email || user.email} disabled /></label>
            <label>새 비밀번호<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="변경할 때만 입력해주세요" /></label>
            {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}
            <button type="submit" className={styles.saveButton} disabled={isSaving}>{isSaving ? '저장 중...' : '회원 정보 저장'}</button>
          </form>
        </section>
      )}

      <div className={styles.menuGrid}>
        <Link to="/orders" className={styles.menuCard}><span className={styles.menuLabel}>주문 내역</span><span className={styles.menuCount}>{orders.length}건</span></Link>
        <Link to="/wishlist" className={styles.menuCard}><span className={styles.menuLabel}>찜한 상품</span><span className={styles.menuCount}>{wishlistItems.length}개</span></Link>
        <Link to="/cart" className={styles.menuCard}><span className={styles.menuLabel}>장바구니</span><span className={styles.menuCount}>{cartItems.length}개</span></Link>
        <Link to="/profile/edit" className={styles.menuCard}><span className={styles.menuLabel}>회원 정보 수정</span><span className={styles.menuArrow}>→</span></Link>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}><h2>장바구니</h2><Link to="/cart">장바구니로 이동</Link></div>
        {isCartLoading && <p className={styles.cartLoading}>장바구니를 불러오는 중입니다.</p>}
        {cartError && <p className={styles.cartError}>{cartError}</p>}
        {!isCartLoading && !cartError && cartItems.length === 0 && (
          <div className={styles.emptyCart}><p>장바구니가 비어있습니다.</p><Link to="/cart" className={styles.shopLink}>장바구니로 이동</Link></div>
        )}
        {!isCartLoading && !cartError && cartItems.length > 0 && (
          <>
            <ul className={styles.cartList}>
              {cartItems.map((item) => {
                const price = Number(item.price || 0)
                const quantity = Number(item.quantity || 0)
                const itemTotal = price * quantity

                return (
                  <li key={item.id} className={styles.cartItem}>
                    <strong>{item.productName || item.name || '상품'}</strong>
                    <span>{price.toLocaleString()}원</span>
                    <span>수량 {quantity}개</span>
                    <b>{itemTotal.toLocaleString()}원</b>
                    <button type="button" onClick={() => handleCartItemDelete(item.id)}>삭제</button>
                  </li>
                )
              })}
            </ul>
            <p className={styles.cartTotal}>전체 합계 <strong>{cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0).toLocaleString()}원</strong></p>
          </>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}><h2>찜한 상품</h2><Link to="/wishlist">전체보기</Link></div>
        {isWishlistLoading && <p className={styles.wishlistLoading}>찜한 상품을 불러오는 중입니다.</p>}
        {wishlistError && <p className={styles.wishlistError}>{wishlistError}</p>}
        {!isWishlistLoading && !wishlistError && wishlistItems.length === 0 && (
          <div className={styles.emptyWishlist}><p>찜한 상품이 없습니다.</p><Link to="/products" className={styles.shopLink}>상품 목록으로 이동</Link></div>
        )}
        {!isWishlistLoading && !wishlistError && wishlistItems.length > 0 && (
          <ul className={styles.wishlistList}>
            {getRecentWishlistItems(wishlistItems).map((item) => (
              <li key={item.id} className={styles.wishlistItem}>
                <img src={item.image} alt={item.productName || item.name || '찜한 상품'} />
                <strong>{item.productName || item.name || '상품'}</strong>
                <span>{Number(item.price || 0).toLocaleString()}원</span>
                <button type="button" onClick={() => handleWishlistItemDelete(item.id)}>삭제</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}><h2>최근 주문 내역</h2><Link to="/orders">전체보기</Link></div>
        {isOrdersLoading && <p className={styles.orderLoading}>주문 내역을 불러오는 중입니다.</p>}
        {ordersError && <p className={styles.orderError}>{ordersError}</p>}
        {!isOrdersLoading && !ordersError && orders.length === 0 && (
          <div className={styles.emptyOrder}><p>아직 주문 내역이 없습니다.</p><Link to="/products" className={styles.shopLink}>상품 보러가기</Link></div>
        )}
        {!isOrdersLoading && !ordersError && orders.length > 0 && (
          <ul className={styles.orderList}>
            {orders.map((order) => (
              <li key={order.id} className={styles.orderItem}>
                <strong>{order.productName || order.name || '주문 상품'}</strong>
                <span>{formatJoinedAt(order.createAt)}</span>
                <span>수량 {order.quantity || 0}개</span>
                <b>{Number(order.totalPrice || order.totalAmount || 0).toLocaleString()}원</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default MyPage
