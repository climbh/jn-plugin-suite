import utils from './utils.js'

const { each } = utils

const event = {
  _eventData: null,

  on(name, func) {
    if (!this._eventData) {
      this._eventData = {}
    }
    if (!this._eventData[name]) {
      this._eventData[name] = []
    }

    let listened = false
    each(this._eventData[name], (registeredHandler) => {
      if (registeredHandler === func) {
        listened = true
        return false
      }

      return true
    })

    if (!listened) {
      this._eventData[name].push(func)
    }
  },

  off(name, func) {
    if (!this._eventData) {
      this._eventData = {}
    }

    const listeners = this._eventData[name]
    if (!listeners || listeners.length === 0) {
      return
    }

    if (!func) {
      this._eventData[name] = []
      return
    }

    each(listeners, function removeHandler(registeredHandler, index) {
      if (registeredHandler === func) {
        this._eventData[name].splice(index, 1)
        return false
      }

      return true
    }, this)
  },

  trigger(name, ...args) {
    if (!this._eventData) {
      this._eventData = {}
    }

    const listeners = this._eventData[name]
    if (!listeners) {
      return true
    }

    let preventDefault = false
    each(listeners, function triggerHandler(handler) {
      preventDefault = handler.apply(this, args) === false || preventDefault
    }, this)

    return !preventDefault
  },
}

export default event
