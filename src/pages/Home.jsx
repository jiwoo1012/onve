import React, { useEffect, useState } from 'react'
import MainBanner from '../components/MainBanner'
import CategoryMenu from '../components/CategoryMenu'
import BestItems from '../components/BestItems'
import BeforeAfter from '../components/BeforeAfter'
import BrandMerit from '../components/BrandMerit'
import EventBanner from '../components/EventBanner'
import BestReview from '../components/BestReview'
import BrandMarquee from '../components/BrandMarquee'
import { getProducts } from '../firebase/productApi'

const Home = () => {
  const [bestProducts, setBestProducts] = useState([])

  useEffect(() => {
    const loadHome = async () => {
      try {
        const productsData = await getProducts()

        const recommendedProducts = productsData.filter((product) => product.isRecommended)
        setBestProducts(recommendedProducts.slice(0, 5))
      } catch (error) {
        console.error('상품 데이터를 불러오지 못했습니다.', error)
      }
    }

    loadHome()
  }, [])

  return (
    <>
      <MainBanner>
        <CategoryMenu />
      </MainBanner>
      <div id="best-items">
        <BestItems products={bestProducts} />
      </div>
      <BeforeAfter />
      <BrandMerit />
      <EventBanner />
      <BestReview />
      <BrandMarquee />
    </>
  )
}

export default Home