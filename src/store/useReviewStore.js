import { useSyncExternalStore } from 'react'
import { createStore } from 'zustand/vanilla'
import { addReview, deleteReview, getAllReviews, getReviewsByProductId, updateReview } from '../firebase/reviewApi'

const reviewStore = createStore((set) => ({
  reviews: [], loading: false, error: '',
  fetchByProductId: async (productId) => { set({ loading: true, error: '' }); try { set({ reviews: await getReviewsByProductId(productId) }) } catch (error) { console.error(error); set({ error: '리뷰를 불러오지 못했습니다.' }) } finally { set({ loading: false }) } },
  fetchAll: async () => { set({ loading: true, error: '' }); try { set({ reviews: await getAllReviews() }) } catch (error) { console.error(error); set({ error: '리뷰를 불러오지 못했습니다.' }) } finally { set({ loading: false }) } },
  add: async (data) => { try { await addReview(data); await reviewStore.getState().fetchByProductId(data.productId); return true } catch (error) { console.error(error); set({ error: '리뷰 등록에 실패했습니다.' }); return false } },
  update: async (id, data) => { try { await updateReview(id, data); set((state) => ({ reviews: state.reviews.map((review) => review.id === id ? { ...review, ...data } : review) })); return true } catch (error) { console.error(error); set({ error: '리뷰 수정에 실패했습니다.' }); return false } },
  remove: async (id) => { try { await deleteReview(id); set((state) => ({ reviews: state.reviews.filter((review) => review.id !== id) })); return true } catch (error) { console.error(error); set({ error: '리뷰 삭제에 실패했습니다.' }); return false } },
}))
const useReviewStore = (selector) => useSyncExternalStore(reviewStore.subscribe, () => selector(reviewStore.getState()), () => selector(reviewStore.getInitialState()))
Object.assign(useReviewStore, reviewStore)
export default useReviewStore
