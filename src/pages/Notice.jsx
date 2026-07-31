import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotices } from '../firebase/noticeApi'
import styles from './Notice.module.scss'

const formatDate = (value) => { const date = value?.toDate?.() || value; return date instanceof Date ? new Intl.DateTimeFormat('ko-KR').format(date) : '-' }
const Notice = () => {
  const [notices, setNotices] = useState([]); const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { getNotices().then(setNotices).catch(console.error).finally(() => setIsLoading(false)) }, [])
  if (isLoading) return <p className={styles.loadingMessage}>공지사항을 불러오는 중입니다.</p>
  return <section className={styles.notice}><h1>공지사항</h1>{notices.length === 0 ? <p className={styles.emptyMessage}>등록된 공지사항이 없습니다.</p> : <ul className={styles.list}>{notices.map((item) => <li key={item.id} className={styles.item}><Link to={`/notice/${item.id}`} className={styles.itemLink}><span className={styles.category}>{item.category || '공지'}</span><span className={styles.title}>{item.title}</span><span className={styles.date}>{formatDate(item.createAt || item.createdAt)}</span></Link></li>)}</ul>}</section>
}
export default Notice
