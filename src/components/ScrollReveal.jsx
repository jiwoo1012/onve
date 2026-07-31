import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './ScrollReveal.module.scss'

gsap.registerPlugin(ScrollTrigger)

// 박스/이미지/카드가 아래에서 위로 슬라이드하며 페이드인
export const ScrollReveal = ({ children, className = '', delay = 0 }) => {
  const boxRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        boxRef.current,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: boxRef.current,
            start: 'top 85%', // 요소 상단이 뷰포트 85% 지점에 닿으면 시작
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, boxRef)

    return () => ctx.revert()
  }, [delay])

  return (
    <div ref={boxRef} className={`${styles.reveal} ${className}`}>
      {children}
    </div>
  )
}

// 텍스트가 마스크 안에서 아래→위로 올라오며 등장
export const RevealText = ({ text, as: Tag = 'h2', className = '', delay = 0.3 }) => {
  const wrapRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrapRef.current.querySelector('span'),
        { yPercent: 120 },
        {
          yPercent: 0,
          duration: 0.9,
          delay, // ScrollReveal보다 늦게 시작 → "박스가 반쯤 나왔을 때 텍스트 등장" 효과
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, wrapRef)

    return () => ctx.revert()
  }, [delay])

  return (
    <Tag ref={wrapRef} className={`${styles.textMask} ${className}`}>
      <span>{text}</span>
    </Tag>
  )
}