import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SearchBox.module.scss'

const SearchBox = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const navigate = useNavigate()

  const spFnc = (e) => {
    e.preventDefault()

    const keyword = searchKeyword.trim()

    if (keyword === '') {
      return
    }

    // encodeURIComponent: 컴퓨터가 알아들을 수 있는 형태로 변환
    navigate(`/search/${encodeURIComponent(keyword)}`)
    setSearchKeyword('')
  }

  return (
    <form className={styles.searchBox} onSubmit={spFnc}>
      <input
        type="search"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        placeholder="검색어를 입력하세요"
      />

      <button type="submit">검색</button>
    </form>
  )
}

export default SearchBox