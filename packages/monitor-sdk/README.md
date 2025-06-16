# 开始

该插件使用[神策数据](https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_use/v0300)提供的sa-javascript-sdk提供底层支持

监听主要是在基座应用中来进行注册,微应用如需注册.

## 1.基座应用注册

**index.html中引入打包后的sdk文件**

```**html**
<script src="<%= BASE_URL %>lib/jn-monitor/index.global.js"></script>
```

**main.ts中进行注册**

```ts
import createMonitor from '@jsjn/monitor-sdk'

// 注册, createMonitor参数可传入一些初始化参数
app.use(createMonitor() as any)
```

这样就完成了埋点sdk的使用

## 2.子应用的使用

### 第一步

``` base
pnpm add @jsjn/monitor-sdk
```

### 第二步

子应用的**vue.congif.js**中找到`externals`配置项添加 **'@jsjn/monitor-sdk': 'JnMonitor'**

## 3.方法函数

@jsjn/monitor-sdk导出了一些函数方法, 可供开发人员进行手工追加自定义上报信息,上报类型

> &#x2139;&#xfe0f; **提示**
> 后续新增方法不在此文档更新, 以具体导出的方法为准.
> 导出**sensorsInstance**为埋点的sdk实例,请确保要使用它并且以阅读文档知道如何使用后在进行使用.

如:

``` ts
import { addRegisterPage, addBuriedPoint } from '@jsjn/monitor-sdk'
// 该函数会像上报的信息中追加一个全局信息, 后面的上报消息中都会携带该数据
addRegisterPage({
  custom_prop1: 'xxx',
  custom_prop2: 'xxx',
})

// 该函数可以自定义上报的类型及上报的信息(该方法是重新发送一条上报,而不是修改)
addBuriedPoint('$useclick', {
  userName: 'admin',
  useId: 123456
})
```

## 4.自定义上报元素

开发者给需要上报的元素添加`data-sensors-click`属性.这时候点击该元素时则会进行一次埋点的上报
如: `<p data-sensors-click>点击我可以发送上报</p>`
