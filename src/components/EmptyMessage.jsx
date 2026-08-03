import React from 'react'
import { Link } from 'react-router-dom'
import styles from './EmptyMessage.module.scss'

const EmptyMessage = ({ image, title, desc, link, linkText }) => {
  return (
    <div className={styles.empty}>
      {image && <img src={image} alt="" className={styles.image} />}
      <p className={styles.title}>{title}</p>
      {desc && <p className={styles.desc}>{desc}</p>}
      {link && linkText && (
        <Link to={link} className={styles.link}>
          {linkText}
        </Link>
      )}
    </div>
  )
}

export default EmptyMessage
