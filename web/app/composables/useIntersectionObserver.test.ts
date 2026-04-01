import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue")
  return {
    ...actual,
    onUnmounted: vi.fn(),
  }
})

vi.mock("~/types", () => ({
  type IntersectionObserverInit: {},
}))

describe("useIntersectionObserver", () => {
  let observeCallback: any = null
  let mockObserver: any

  beforeEach(() => {
    vi.clearAllMocks()
    observeCallback = null

    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }

    global.IntersectionObserver = vi.fn((callback: any) => {
      observeCallback = callback
      return mockObserver
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should create observer with default options", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    useIntersectionObserver(callback)
    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { once: true })
  })

  it("should observe element when observe is called", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    const mockElement = document.createElement("div")
    const { observe } = useIntersectionObserver(callback)
    observe(mockElement)
    expect(mockObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it("should unobserve element when unobserve is called", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    const mockElement = document.createElement("div")
    const { unobserve } = useIntersectionObserver(callback)
    unobserve(mockElement)
    expect(mockObserver.unobserve).toHaveBeenCalledWith(mockElement)
  })

  it("should disconnect observer when disconnect is called", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    const { disconnect } = useIntersectionObserver(callback)
    disconnect()
    expect(mockObserver.disconnect).toHaveBeenCalled()
  })

  it("should call unobserve when element intersects in once mode", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    const mockElement = document.createElement("div")
    const { observe } = useIntersectionObserver(callback, { once: true })
    observe(mockElement)
    const mockEntry: Partial<IntersectionObserverEntry> = { isIntersecting: true, target: mockElement }
    if (observeCallback) observeCallback([mockEntry as IntersectionObserverEntry], mockObserver)
    expect(mockObserver.unobserve).toHaveBeenCalledWith(mockElement)
  })

  it("should respect custom threshold option", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    useIntersectionObserver(callback, { threshold: 0.5 })
    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ threshold: 0.5 }))
  })

  it("should respect custom rootMargin option", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    useIntersectionObserver(callback, { rootMargin: "100px" })
    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ rootMargin: "100px" }))
  })

  it("should not unobserve when once is false", async () => {
    const { useIntersectionObserver } = await import("./useIntersectionObserver")
    const callback = vi.fn()
    const mockElement = document.createElement("div")
    const { observe } = useIntersectionObserver(callback, { once: false })
    observe(mockElement)
    const mockEntry: Partial<IntersectionObserverEntry> = { isIntersecting: true, target: mockElement }
    if (observeCallback) observeCallback([mockEntry as IntersectionObserverEntry], mockObserver)
    expect(mockObserver.unobserve).not.toHaveBeenCalled()
  })
})
