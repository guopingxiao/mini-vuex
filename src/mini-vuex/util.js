
/**
 * forEach 对象并返回对应key的函数fn(key, value)
 * @param {*} obj 
 * @param {*} fn 
 */
function forEachObj(obj, fn) { 
  Object.keys(obj).forEach(key => fn(key, obj[key]))
}

export {  
  forEachObj
}