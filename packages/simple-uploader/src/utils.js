const objectPrototype = Object.prototype
const arrayPrototype = Array.prototype
const serialize = objectPrototype.toString

const isFunction = fn => serialize.call(fn) === '[object Function]'

const isArray = Array.isArray || /* istanbul ignore next */ (value => serialize.call(value) === '[object Array]')

function isPlainObject(value) {
  return serialize.call(value) === '[object Object]' && Object.getPrototypeOf(value) === objectPrototype
}

let uid = 0

const utils = {
  uid() {
    uid += 1
    return uid
  },

  noop() {},

  bind(fn, context) {
    return (...args) => fn.apply(context, args)
  },

  preventEvent(evt) {
    evt.preventDefault()
  },

  stop(evt) {
    evt.preventDefault()
    evt.stopPropagation()
  },

  nextTick(fn, context) {
    setTimeout(utils.bind(fn, context), 0)
  },

  toArray(arrayLike, start = 0, end = arrayLike.length) {
    return arrayPrototype.slice.call(arrayLike, start, end)
  },

  isPlainObject,
  isFunction,
  isArray,

  isObject(value) {
    return Object(value) === value
  },

  isString(value) {
    return typeof value === 'string'
  },

  isUndefined(value) {
    return typeof value === 'undefined'
  },

  isDefined(value) {
    return typeof value !== 'undefined'
  },

  each(collection, iteratee, context) {
    if (!collection) {
      return
    }

    if (utils.isDefined(collection.length)) {
      for (let index = 0; index < collection.length; index += 1) {
        if (iteratee.call(context, collection[index], index, collection) === false) {
          break
        }
      }
      return
    }

    for (const key in collection) {
      if (iteratee.call(context, collection[key], key, collection) === false) {
        break
      }
    }
  },

  evalOpts(data, ...args) {
    return utils.isFunction(data) ? data(...args) : data
  },

  extend(...args) {
    let target = args[0] || {}
    let startIndex = 1
    let force = false

    if (typeof target === 'boolean') {
      force = target
      target = args[1] || {}
      startIndex = 2
    }

    if (typeof target !== 'object' && !isFunction(target)) {
      target = {}
    }

    if (startIndex >= args.length) {
      target = this
      startIndex -= 1
    }

    for (let index = startIndex; index < args.length; index += 1) {
      const source = args[index]
      if (source == null) {
        continue
      }

      for (const key in source) {
        const currentValue = target[key]
        const nextValue = source[key]

        if (target === nextValue) {
          continue
        }

        if (force && nextValue && (isPlainObject(nextValue) || isArray(nextValue))) {
          const clone = isArray(nextValue)
            ? (isArray(currentValue) ? currentValue : [])
            : (isPlainObject(currentValue) ? currentValue : {})

          target[key] = utils.extend(true, clone, nextValue)
          continue
        }

        if (nextValue !== undefined) {
          target[key] = nextValue
        }
      }
    }

    return target
  },

  formatSize(size) {
    if (size < 1024) {
      return `${size.toFixed(0)} bytes`
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(0)} KB`
    }
    if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`
    }

    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
  },

  defineNonEnumerable(target, key, value) {
    Object.defineProperty(target, key, {
      enumerable: false,
      configurable: true,
      writable: true,
      value,
    })
  },
}

export default utils
