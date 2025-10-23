import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppTopbar from './AppTopbar'
import AppSidebar from './AppSidebar'

export default function AppLayout() {
  const [mobileMenuActive, setMobileMenuActive] = useState(false)
  const [staticMenuInactive, setStaticMenuInactive] = useState(false)

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 991

  const onMenuToggle = () => {
    if (isMobile()) {
      setMobileMenuActive((s) => !s)
    } else {
      setStaticMenuInactive((s) => !s)
    }
  }

  const hideMenu = () => setMobileMenuActive(false)

  const wrapperClass = ['layout-wrapper', 'layout-static']
  if (mobileMenuActive) wrapperClass.push('layout-mobile-active')
  if (staticMenuInactive) wrapperClass.push('layout-static-inactive')

  return (
    <div className={wrapperClass.join(' ')}>
      <AppTopbar onMenuToggle={onMenuToggle} />
      <AppSidebar visible={mobileMenuActive} onHide={hideMenu} />
      <div className="layout-mask" onClick={hideMenu} />

      <div className="layout-main-container">
        <main className="layout-main">
          <Outlet />
        </main>
        <footer className="layout-footer">
          <span className="text-600 text-sm">Inventario Piñatería · Sakai Layout</span>
        </footer>
      </div>
    </div>
  )
}
