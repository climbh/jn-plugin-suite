# MonitorSDK

## 介绍

该插件使用[神策数据](https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_use/v0300)提供的sa-javascript-sdk提供底层支持

monitor-sdk在基座应用中注册和监听进行基础的埋点上报, 子应用无需注册, 只需要调用提供的一些方法进行自定义上报即可.

## 开始

### 基座应用初始化

#### 1.index.html中引入打包后的sdk文件

```**html**
<script src="<%= BASE_URL %>lib/jn-monitor/index.global.js"></script>
```

#### 2.main.ts中进行注册

```ts
import monitorSDK from '@jsjn/monitor-sdk'

// 注册
app.use(monitorSdk(window.__MONITOR_SDK_CONFIG__, window.__MONITOR_SDK_GLOBAL_PROPERTIES__) as any)
```

> &#x2139;&#xfe0f;
> **注册时机在router, store之后**

#### 3.vue.config.js排除监控sdk

`externals`中添加配置 **'@jsjn/monitor-sdk': 'JnMonitor'**

#### 4.全局常量

**这些全局常量定义在index.html平级的globalVariable.js中**

`__ENABLE_MONITOR_SDK__`: 是否开启monitor-sdk

`__MONITOR_SDK_CONFIG__`: monitor-sdk的初始化配置

`__MONITOR_SDK_GLOBAL_PROPERTIES__`: monitor-sdk的公共上报属性(该属性会添加到每次上报的内容中)

##### 配置选项说明

`__MONITOR_SDK_CONFIG__`支持以下配置选项：

- `enable_sdk`: 是否启用SDK (默认: true)
- `enable_page_leave`: 是否开启页面离开事件采集 (默认: true)
- `enable_page_view`: 是否开启页面浏览事件采集 (默认: true)
- `enable_app_load`: 是否开启应用加载事件采集 (默认: true)
- `enable_first_visit_profile`: 是否开启首次访问用户属性自动设置 (默认: true)
  - 设置为 `false` 可禁用SDK自动调用 `profile_set_once` 设置首次访问时间等属性
- `server_url`: 数据接收地址 (必填)
- `batch_send`: 是否批量发送 (默认: false)
- `send_type`: 发送方式 ('image' | 'ajax' | 'beacon', 默认: 'image')
- `use_base64`: 是否使用base64编码 (默认: false)
- `use_client_time`: 是否使用客户端时间 (默认: false)
- `is_track_single_page`: 是否追踪单页应用 (默认: true)
- `use_app_track`: 是否使用应用追踪 (默认: false)
- `encrypt_cookie`: 是否加密cookie (默认: false)
- `show_log`: 是否显示日志 (默认: false)
- `heatmap`: 热力图配置
  - `clickmap`: 点击图配置 ('default' | 'not_collect', 默认: 'default')
  - `scroll_notice_map`: 触达图配置 ('default' | 'not_collect', 默认: 'default')

### 子应用的使用

子应用如果使用自定义埋点则进行下面的操作,否则不需要进行任何操作

#### 1.安装sdk

``` base
pnpm add @jsjn/monitor-sdk
```

#### 2.vue.config.js排除监控sdk

`externals`中添加配置 **'@jsjn/monitor-sdk': 'JnMonitor'**

> &#x2139;&#xfe0f;
> 这一步一定不要省略, 虽然也可以使用, 但是会导致monitorsdk的实例不一致, 上报的数据丢失一些默认绑定的数据

## 提供的方法

`@jsjn/monitor-sdk`导出了一些函数方法, 可供开发人员进行手工追加自定义上报信息,上报类型

> &#x2139;&#xfe0f;
> 后续如果新增方法可能不在此文档更新, 以具体导出的方法为准.

示例:

``` ts
import { createEventTracker, getMonitorInstance, registerSuperProperties, reportEvent } from '@jsjn/monitor-sdk'
// 该函数会像上报的信息中追加一个全局信息, 后面的上报消息中都会携带该数据
registerSuperProperties({
  custom_prop1: 'xxx',
  custom_prop2: 'xxx',
})

// 该函数可以自定义上报的类型及上报的信息(参数只存在这一次上报中)
reportEvent('$useclick', {
  userName: 'admin',
  useId: 123456
})

// 获取monitor实例
const monitorInstance = getMonitorInstance()

// 自定义链式操作的上报
const trackerInstance = createEventTracker('$user')

trackerInstance.addProperties({
  processId: '12313'
}).addProperties({
  type: 'edit'
}).report()

trackerInstance.addProperties({
  type: 'save'
}).report()
```

## 自定义上报元素

开发者给需要上报的元素添加`data-sensors-click`属性.这时候点击该元素时则会进行一次埋点的上报
如: `<p data-sensors-click>点击我可以发送上报</p>`
