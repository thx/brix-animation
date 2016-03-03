/**
 * 常量
 * @param  {[type]} ) {             return {    BX_ANIMATION_HOOK: 'bx-animation',     BX_ANIMATION_NAMESPACE: '.' + (Math.random() + '').replace(/D/g, '')   }} [description]
 * @return {[type]}   [description]
 */
define([], function() {
  return {
    BX_ANIMATION_HOOK: 'bx-animation', //配置钩子
    BX_ANIMATION_NAMESPACE: '.' + (Math.random() + '').replace(/\D/g, '') //事件命名空间
  }
})
