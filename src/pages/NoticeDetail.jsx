import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getNoticeById, getNotices } from '../firebase/noticeApi'
import styles from './NoticeDetail.module.scss'

const formatDate = (value) => { const date = value?.toDate?.() || value; return date instanceof Date ? new Intl.DateTimeFormat('ko-KR').format(date) : '-' }
const NoticeDetail = () => {
  const { id } = useParams(); const navigate = useNavigate(); const [notice, setNotice] = useState(null); const [notices, setNotices] = useState([]); const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { Promise.all([getNoticeById(id), getNotices()]).then(([current, all]) => { setNotice(current); setNotices(all) }).catch(console.error).finally(() => setIsLoading(false)) }, [id])
  if (isLoading) return <p className={styles.loadingMessage}>불러오는 중입니다.</p>
  if (!notice) return <div className={styles.notFound}><p>공지사항을 찾을 수 없습니다.</p><Link to="/notice">목록으로 돌아가기</Link></div>
  const index = notices.findIndex((item) => item.id === id); const newer = index > 0 ? notices[index - 1] : null; const older = index < notices.length - 1 ? notices[index + 1] : null
  return <section className={styles.noticeDetail}><div className={styles.header}><span className={styles.category}>{notice.category || '공지'}</span><h1>{notice.title}</h1><span className={styles.date}>{formatDate(notice.createAt || notice.createdAt)}</span></div><p className={styles.content}>{notice.content}</p><div className={styles.articleNav}>{newer ? <button type="button" className={styles.navItem} onClick={() => navigate(`/notice/${newer.id}`)}><span className={styles.navLabel}>이전글</span><span className={styles.navTitle}>{newer.title}</span></button> : <div className={`${styles.navItem} ${styles.navDisabled}`}>이전 글이 없습니다.</div>}{older ? <button type="button" className={styles.navItem} onClick={() => navigate(`/notice/${older.id}`)}><span className={styles.navLabel}>다음글</span><span className={styles.navTitle}>{older.title}</span></button> : <div className={`${styles.navItem} ${styles.navDisabled}`}>다음 글이 없습니다.</div>}</div><div className={styles.bottomBar}><Link to="/notice" className={styles.backButton}>목록으로</Link></div></section>
}
export default NoticeDetail
