

/**
 * 主菜
 * @param  {[type]} $                [description]
 * @param  {[type]} _                [description]
 * @param  {[type]} compatEventName) {               var testNode [description]
 * @return {[type]}                  [description]
 */
define([
  'jquery',
  'underscore',
  './animation/compatEventName',
  './animation/registCommand',
  // './animation/allDomEvents',
  './animation/initAnimation',
  './animation/constant'
], function($, _, compatEventName, registCommand, /*allDomEvents,*/ initAnimation, Constant) {
  /**
   * [Animation description]
   */
  function Animation(options) {
    var self = this;

    //配置
    this.options = $.extend(true, {
      el: 'body', //容器
      owner: {} //execute执行方法的宿主
    }, options)

    //内建的动画命令，可以this.extend(name, fn)扩展之
    this._builtinCommands = {}

    //所有自定义待触发的事件
    this._customEmits = {}

    //所有事件代理的集合容器
    this._delegateEvents = []

    //每个animation实例拥有自己的事件命名空间
    //destroy时只销毁当前实例
    this._eventNamespace = '.' + (Math.random() + '').replace(/\D/g, '')

    //注册内建的命令
    registCommand.call(self)

    //所有的带bx-animation的节点
    var allAnimNode = $(self.options.el).find('[' + Constant.BX_ANIMATION_HOOK + ']')

    //各节点进行动画绑定
    _.each(allAnimNode, function(node, i) {

      //解析bx-animation配置
      initAnimation.call(self, $(node))

    })
  }

  /**
   * Animation的所有方法
   * @type {Object}
   */
  Animation.prototype = {

    //销毁
    destroy: function() {
      _.each(this._delegateEvents, function(eventType) {
        $(document.body).off(eventType)
      })
    },

    /**
     * 注册自定义的命令
     * @param  {[type]}   name 命令名称
     * @param  {Function} fn   命令函数体
     *  function (step) {}
     *      step {object}
     *          step.node //当前节点
     *          step.index //命令的index
     *          step.param //命令的参数
     *          step.done //执行完命令后的回调函数，会顺序调用接下来的命令
     */
    extend: function(name, fn) {
      this._builtinCommands[name] = fn
    }
  }

  return Animation
})