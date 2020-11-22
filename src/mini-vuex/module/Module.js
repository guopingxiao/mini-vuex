import { forEachObj } from '../util'

export default class Module { 
  constructor(newModule) { 
    this._raw = newModule
    this._children = {}
    this.state = newModule.state
  }

  getChild(key) { 
    return this._children[key]
  }

  addChild(key, module) { 
    this._children[key] = module
  }

  // class的写法比对象更容易扩展和维护， 可以在下面继续扩展别的方法

  forEachMutation(fn) {
    if (this._raw.mutations) {
      forEachObj(this._raw.mutations, fn)
    }
  }

  forEachAction(fn) {
    if (this._raw.actions) {
      forEachObj(this._raw.actions, fn)
    }
  }

  forEachGetter(fn) {
    if (this._raw.getters) {
      forEachObj(this._raw.getters, fn)
    }
  }

  forEachChild(fn) {
    if (this._raw.children) {
      forEachObj(this._raw.children, fn)
    }
  }
}