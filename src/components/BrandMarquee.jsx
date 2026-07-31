import styles from './BrandMarquee.module.scss'

const BrandMarquee = () => {
  const text = 'See better. Feel better. Be onve.'

  return (
    <section className={styles.marquee} aria-label={text}>
      <div className={styles.track}>
        {Array.from({ length: 1 }).map((_, index) => (
          <span className={styles.item} key={index}>
            {text}
          </span>
        ))}
      </div>
    </section>
  )
}

export default BrandMarquee
 