import useApp from '../hooks/useApp'
import { addMenuInfo } from './private-event'

export default function listeningToRoute() {
  const { $router } = useApp()
  $router?.beforeResolve((to) => {
    addMenuInfo(to.path)
  })
}
