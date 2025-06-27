import { reportEvent } from '../core'
import useApp from '../hooks/useApp'
import { getOrigin, getWindow, queryTransform2UrlParams } from '../utils'

/**
 * 自定义页面加载性能插件保证更多的数据上报
 */

export default {
  plugin_name: 'pageleave',
  init(sd: any) {
    sd.ee.sdk.on('ready', () => {
        collectPageLeave()
    })
  },
}

const _window = getWindow()

export function collectPageLeave() {
  const router = useApp().$router
  if(router) {
  router.beforeEach((to, from, next) => {
    // 检查路径是否发生变化（忽略查询参数）
    if (from.path !== to.path) {
      reportPageLeave(getOrigin() + from.path  + `${queryTransform2UrlParams(from.query)}`,);
    }
    next();
  });
  }
  let startTime = Date.now();
  // 页面可见性变化
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      reportPageLeave(getUrl());
    }
  };

  // 页面卸载
  const handleUnload = () => {
    reportPageLeave(getUrl());
  };

  // 上报离开事件
  function reportPageLeave(fromUrl: any) {
    const duration = formatDuration(Date.now() - startTime) ;
    reportEvent('$WebPageLeave', {
      event_duration: duration,
      $referrer: fromUrl,
    })
    startTime = Date.now();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  // window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
}


// 毫秒转为秒
function formatDuration(duration: number) {
  return duration / 1000;
}

function getUrl() {
  return getWindow().location.href
}