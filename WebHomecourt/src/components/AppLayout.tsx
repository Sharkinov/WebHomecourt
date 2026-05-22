import { Outlet } from 'react-router-dom'
import Nav from './Nav/Nav'

function AppLayout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

export default AppLayout
