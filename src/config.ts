import {
  ArchiveBoxIcon,
  TagIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import Locations from './pages/Locations'
import Login from './pages/Login'
import Boxes from './pages/Boxes'
import Items from './pages/Items'

type RouteRedirect = {
  id: string
  type: 'redirect'
  path: string
  redirect: string
}

export type RouteId = 'home' | 'login' | 'boxes' | 'locations' | 'items'
type RoutePage = {
  id: RouteId
  type: 'page'
  name: string
  path: string
  protected: boolean
  component: React.ComponentType
} & ({
  navigation: true
  icon: React.ElementType,
} | {
  navigation: false
})

export type Route = RoutePage | RouteRedirect

const routes: Route[] = [
  { id: 'home', path: '/', type: 'redirect', redirect: '/items' },
  { id: 'items', path: '/items', type: 'page', name: 'Items', navigation: true, protected: true, icon: TagIcon, component: Items },
  { id: 'boxes', path: '/boxes', type: 'page', name: 'Boxes', navigation: true, protected: true, icon: ArchiveBoxIcon, component: Boxes },
  { id: 'locations', path: '/locations', type: 'page', name: 'Locations', navigation: true, protected: true, icon: MapPinIcon, component: Locations },
  { id: 'login', path: '/login', type: 'page', name: 'Login', protected: false, navigation: false, component: Login },
]

type Config = {
  routes: Route[]
}

const config: Config = {
  routes
}

export default config