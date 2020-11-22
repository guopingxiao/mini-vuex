import { forEachValue } from "../util"
import Module from './module'

class ModuleCollection {
  constructor(options) {
    this.register([], options)    // stack = [根对象, a, c]  [根对象, b]  栈结构
  }

  // 获取到 一个 namespaced 拼接的路径  
  getNamespaced(path) {
    let root = this.root      //从根模块开始找
    return path.reduce((str, key) => {
      root = root.getChild(key)     // 不停的去找当前的模块
      return str + ( root.namespaced ? key + '/' : '')   // a/c/   c/
    }, '')    // 参数是一个字符串
  }

  register(path, rootModule) {
    let newModule = new Module(rootModule)

    if(path.length == 0) {
      // 根模块
      this.root = newModule
    } else {
      // [a]
      // [b]
      let parent = path.slice(0, -1).reduce((memo, current) => {
        return memo.getChild(current)
      }, this.root)

      parent.addChild(path[path.length-1], newModule)
    }

    if(rootModule.modules) {
      forEachValue(rootModule.modules, (module, moduleName) => {
        // [a]
        // [b]
        this.register(path.concat(moduleName), module)
      })
    }

  }
}

export default ModuleCollection






/**
 * 
 * this.root = {
 *  _raw: 根模块
 *  _children: {
 *    a: {
 *      _raw: 'a模块',
 *      _children: {
 *        c: {
 *            _raw: 'c模块',
 *            _children: {},
 *            state: 'c状态'
 *          }
 *      },
 *      state: 'a状态'
 *    },
 *    b: {
 *      _raw: 'b模块',
 *      _children: {},
 *      state: 'b状态'
 *    }
 *  },
 *  state: '根模块自己的状态'
 *  
 * }
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */