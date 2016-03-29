/**
 * 兼容性动画事件名
 * @param  {[type]} $  [description]
 * @param  {[type]} _) {}          [description]
 * @return {[type]}    [description]
 */
define([
  'jquery',
  'underscore'
], function($, _) {

  // 兼容动画事件
  var transitionEnd = 'transitionend';
  var animationEnd = 'animationend';
  var transitionProperty = 'transition';
  var animationProperty = 'animation';

  try { //dom未定义在ie8下会报错
    var dom = dom
  } catch (err) {
    dom = null
  }

  if (!('ontransitionend' in window)) {
    if ('onwebkittransitionend' in window) {

      // Chrome/Saf (+ Mobile Saf)/Android
      transitionEnd += ' webkitTransitionEnd';
      transitionProperty = 'webkitTransition'
    } else if ((dom && dom.tNode && 'onotransitionend' in dom.tNode) || navigator.appName === 'Opera') {

      // Opera
      transitionEnd += ' oTransitionEnd';
      transitionProperty = 'oTransition';
    }
  }
  if (!('onanimationend' in window)) {
    if ('onwebkitanimationend' in window) {
      // Chrome/Saf (+ Mobile Saf)/Android
      animationEnd += ' webkitAnimationEnd';
      animationProperty = 'webkitAnimation';

    } else if (dom && dom.tNode && 'onoanimationend' in dom.tNode) {
      // Opera
      animationEnd += ' oAnimationEnd';
      animationProperty = 'oAnimation';
    }
  }

  return {
    transitionEnd: transitionEnd,
    animationEnd: animationEnd,
    transitionProperty: transitionProperty,
    animationProperty: animationProperty
  }
})