export function useNavigation() {
  const isActive = (path: string, currentPath: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath.startsWith('/recipes/')
    }
    return currentPath.startsWith(path)
  }

  return {
    isActive,
  }
}
