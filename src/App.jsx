import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'

import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Notice from './pages/Notice'
import NoticeDetail from './pages/NoticeDetail'
import SearchResult from './pages/SearchResult'
import NotFound from './pages/NotFound'
import styles from './App.module.scss'
import MyPage from './pages/MyPage'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Admin from './pages/Admin'
import useAuthStore from './store/authStore'

const App = () => {
  const location = useLocation()
  const [toastMessage, setToastMessage] = useState('')
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    const message = window.sessionStorage.getItem('toastMessage')
    if (!message) return

    setToastMessage(message)
    window.sessionStorage.removeItem('toastMessage')
  }, [location.pathname])

  return (
    <div className={styles.app}>
      <Header />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/products' element={<Products/>}/>
          <Route path="/products/:id" element={<ProductDetail />} />
          {/* 수정: 카테고리 이름을 주소 파라미터로 받는 경로입니다. */}
          <Route path="/products/category/:category" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/members" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/recommendations" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/notices" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notice" element={<Notice />} />
          <Route path="/notice/:id" element={<NoticeDetail />} />
          {/* 수정: 헤더에서 전달한 검색어를 주소 파라미터로 받습니다. */}
          <Route path="/search/:keyword" element={<SearchResult />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
