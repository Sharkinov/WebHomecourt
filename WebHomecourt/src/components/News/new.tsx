import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { supabase } from "../../lib/supabase"

type NewsItem = {
  news_id: number
  title: string
  news_url: string
  photo_url: string
  date_posted: string
  category: string
}

async function getRecentNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase.rpc("get_recent_news")
  if (error) {
    console.error("Supabase error loading news:", error.message)
    throw new Error("Failed to load news")
  }

  return data ?? []
}

function News() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const container = scrollRef.current
    if (!container) return
    const maxScrollLeft = container.scrollWidth - container.clientWidth
    setCanScrollLeft(container.scrollLeft > 4)
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 4)
  }

  const scrollNews = (direction: "left" | "right") => {
    const container = scrollRef.current
    if (!container) return
    const groupWidth = (293 + 26) * 4
    container.scrollBy({
      left: direction === "right" ? groupWidth : -groupWidth,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    let isMounted = true
    const loadNews = async () => {
      try {
        const recentNews = await getRecentNews()
        if (isMounted) {
          setNews(recentNews)
          setError(false)
        }
      } catch {
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadNews()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    updateScrollState()
    window.addEventListener("resize", updateScrollState)
    return () => window.removeEventListener("resize", updateScrollState)
  }, [news])

  if (loading) {
    return (
      <section className="bg-[#fdfdfd] border border-black/25 rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="text-morado-lakers text-[28px] md:text-[32px] font-medium">Breaking news</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[150px] rounded-xl bg-gris-claro animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!news.length && !error) return null

  return (
    <section className="bg-[#fdfdfd] border border-black/25 rounded-2xl p-5 md:p-6 flex flex-col gap-5 overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-morado-lakers text-[28px] md:text-[32px] font-medium">Breaking news</h2>
        {(canScrollLeft || canScrollRight) && (
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous news"
              className="w-9 h-9 rounded-full border border-black/20 text-morado-lakers flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-morado-lakers hover:text-texto-claro transition-colors"
              disabled={!canScrollLeft}
              type="button"
              onClick={() => scrollNews("left")}
            >
              <LuChevronLeft size={20} />
            </button>
            <button
              aria-label="Next news"
              className="w-9 h-9 rounded-full border border-black/20 text-morado-lakers flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-morado-lakers hover:text-texto-claro transition-colors"
              disabled={!canScrollRight}
              type="button"
              onClick={() => scrollNews("right")}
            >
              <LuChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-Gris-Oscuro text-sm">News could not be loaded right now.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-[26px] overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={updateScrollState}
        >
          {news.map((item) => (
            <a
              key={item.news_id}
              href={item.news_url}
              rel="noopener noreferrer"
              target="_blank"
              className="group relative h-[150px] w-[293px] min-w-[293px] overflow-hidden rounded-xl no-underline shadow-sm focus:outline-none focus:ring-2 focus:ring-morado-lakers focus:ring-offset-2"
            >
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={item.photo_url}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a123f]/95 via-[#542581]/65 to-black/30" />
              <div className="absolute inset-x-0 bottom-0 flex h-[97px] flex-col gap-2 overflow-hidden rounded-xl px-5 py-3 text-texto-claro">
                <span className="text-[12px] font-semibold uppercase leading-none">
                  {item.category}
                </span>
                <h3 className="line-clamp-2 max-w-[230px] text-[15px] font-semibold leading-tight">
                  {item.title}
                </h3>
                <span className="text-[14px] leading-none">
                  {formatDistanceToNow(new Date(item.date_posted), { addSuffix: true })}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

export default News