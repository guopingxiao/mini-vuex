import { forEachObj } from "../util"
import Module from './Module'

export default class ModuleCollection { 
  constructor(options) { 
    this.register([], options) // 借助于stack 的数据结构，将[根节点, a, c] [根节点，c] 这样的栈结构，转化为如下面的树结构，其中前一个节点是后一个节点的父节点
  }
  register(path, rootModule) { // 深度优先搜索, 将rootModule，转化为下面的数据结构
    const { moudles } = rootModule

    let newModule = new Module(rootModule)
    // let newModule = {   // newModule为格式化后的数据结构
    //   _raw: rootModule, // 根模块
    //   _children: {},    // children 为模块的儿子，刚创建时并不知道children是什么，在稍后的遍历中，动态赋值，创建一颗完整的树
    //   state: rootModule.state // 当前模块state为模块的状态
    // }
    
    if (path.length == 0) {
      // 根模块
      this.root = rootModule
    } else { //[a,c] [b]
      // [a,b,c,d]
      let parent = path.slice(0, -1).reduce(
        (memo, current) => { // 去掉最后一个，reduce找到最后一个的parent,比循环好用
        // return memo._children[current] // 这里的返回会作为下一次的memo , 通过this.root children去找a, a.children去找b,b.children去找c, 找最后的c即为parent
        return memo.getChild(current) 
      }, this.root)

      const lastMoudleIndex = path[path.length - 1]
      parent.addChild(lastMoudleIndex, newModule)
      // parent.root._children[lastMoudleIndex] = newModule
    }
    
    if (moudles) { 
      forEachObj(moudles, (moduleName, module) => { // 循环模块[a] [b]
        this.register(path.concat(moduleName), module) // 递归构建树的数据结构
      })
    }

  }

}

/** 
 *  格式化后的数据结构，树的数据结构更好做递归实现；
 * index里有modules[a,b], a里面有modules c 这样的结构：

this.root = {
  _raw: '根模块',
  _children: {
    a: {
      _raw: 'a模块',
      _children: {
        c: {
          ....
        }
      },
      state: 'a自己的状态'
    },
    b: {
      _raw: 'b模块',
      _children: {},
      state: 'b自己的状态'
    }
  },
  state: '根模块自己的状态'
} */