import { useState, useEffect } from 'react'

const MINIMUM_WIDTH = 768

const useIsMobile = (width = MINIMUM_WIDTH) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < width)
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [width])

  return isMobile
}

export default useIsMobile
