import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return <p>관리자 권한을 확인하는 중입니다.</p>
  }

  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  return children
}

export default AdminRoute
