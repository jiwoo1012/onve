import { create } from 'zustand'
import { getUserPoints, getUserCoupons, addUserPoints } from '../firebase/pointsApi'

export const usePointStore = create((set, get) => ({
  points: 0,
  coupons: [],
  isLoaded: false,

  fetchUserBenefits: async (uid) => {
    if (!uid) return
    try {
      const [points, coupons] = await Promise.all([
        getUserPoints(uid),
        getUserCoupons(uid),
      ])
      set({ points, coupons, isLoaded: true })
    } catch (error) {
      console.error(error)
    }
  },

  // 주문 확정 등에서 호출: 서버(Firestore) 반영 + 로컬 상태 즉시 갱신
  earnPoints: async (uid, amount) => {
    if (!uid || !amount) return
    await addUserPoints(uid, amount)
    set({ points: get().points + amount })
  },

  usePoints: async (uid, amount) => {
    if (!uid || !amount) return
    await addUserPoints(uid, -amount)
    set({ points: get().points - amount })
  },

  reset: () => set({ points: 0, coupons: [], isLoaded: false }),
}))