/**
 * 兼容性动画事件名
 * @param  {[type]} $  [description]
 * @param  {[type]} _) {}          [description]
 * @return {[type]}    [description]
 */
define('compatEventName',[
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
});
/**
 * 常量
 */
define('constant',[], function() {
  return {
    BX_ANIMATION_HOOK: 'bx-animation' //配置钩子
  }
})
;
/**
 * 所有内建的命令
 * @param  {[type]} $       [description]
 * @param  {[type]} _)      {               return Magix.View.extend({    init: function(e) {                 this.viewOptions [description]
 * @param  {[type]} render: function()    {                                var   self        [description]
 * @return {[type]}         [description]
 */
define('extendCommand',[
  'jquery',
  'underscore',
  './compatEventName',
  './constant'
], function($, _, compatEventName, Constant) {

  /**
   * 注册内建的命令
   * @return {[type]} [description]
   */
  function extendCommand(Animation) {
    // var self = this
    //在事件触发时，需要清空已经添加上的样式名，回到初始化
    var addedClass = [] //已经添加的样式名数组
    var waitItv //setTimeout在on事件触发时被清除

    /**
     * 事件触发
     * dom事件绑定，同类型只能出现一次
     * 自定义事件需要emit触发
     */
    Animation.extend('on', function(step) {
      var eventType = step.param
      var node = step.node
      var done = step.done
      var index = step.index
      var $body = $(document.body)
      var eventName = eventType + step.instance._eventNamespace

      //事件代理到body根节点
      $body.on(eventName, '[' + Constant.BX_ANIMATION_HOOK + ']', function(e) {

        if (node[0] === e.currentTarget) {
          //on事件时清除setTimeout
          clearTimeout(waitItv)

          //清空附加上的class，初始化
          console.log(addedClass)
          _.each(addedClass, function(item) {
            node.removeClass(item)
          })
          addedClass = []

          done(e, index)
        }
      })

      if (_.indexOf(step.instance._delegateEvents, eventName) === -1) {
        step.instance._delegateEvents.push(eventName)
      }
    })

    /**
     * 执行方法
     * @param {object owner}
     * @param  {[type]} step) {                     } [description]
     * @return {[type]}       [description]
     */
    Animation.extend('execute', function(step, event) {
      var param = $.trim(step.param)
      var node = step.node
      var done = step.done
      var owner = step.instance.options.owner //执行方法的宿主

      //解析方法&参数
      // testclick(1,2,3)
      var parseExecuteReg = /([^\(\)]+)(\(.+\))?/
      var execute = parseExecuteReg.exec(param)
      var func = execute[1]
      var params = []

      //标识动画在进行中
      node.isAnimating = true

      if (execute[2]) {
        params = eval( '([' + $.trim(/\((.+)\)/.exec(execute[2])[1]) +'])' )
      }

      //
      event = event || {}
      event.node = node //event挂载上当前node节点
        //加上事件event
      params.unshift(event)

      if (parseExecuteReg) {
        if (owner[func]) {
          var isStop = owner[func].apply(owner, params)

          //返回的是promise
          if (_.isObject(isStop) && isStop.then && isStop.fail && isStop.done) {

            isStop.then(function(param) {
              if (param !== false) { //函数返回false会中断动画流程
                done(event)
                node.isAnimating = false
              }
            })
          }

          //如果return false，会中断后续动效
          else if (isStop !== false) {
            done(event)
            node.isAnimating = false
          }
        } else {
          throw '方法：' + func + '不存在'
        }
      } else {
        done(event)
        node.isAnimating = false
      }
    })


    /**
     * 触发指定的when事件 emit/when
     * 可以指定触发多个when事件，以逗号分隔
     * @param  {[type]} step) {                     } [description]
     * @return {[type]}       [description]
     */
    Animation.extend('call', function(step, event) {
      var param = step.param
      var node = step.node
      var done = step.done

      var whenNames = _.map(param.split(','), function(item) {
        return $.trim(item)
      })

      _.each(whenNames, function(name) {
        //触发自定义的事件
        _.each(step.instance._customEmits[name], function(emit) {
          emit.done()
        })
      })

      //
      done(event)
    })



    /**
     * 添加样式
     */
    //一个class里不允许同时出现animation跟transition动画
    //请分两个class执行
    //动画结束回调只会执行一次
    Animation.extend('class', function(step, event) {
      var param = step.param
      var node = step.node
      var done = step.done
      var eventNamespace = step.instance._eventNamespace
      var isAnimEndCallback = false

      /**
       * className格式：class:className,[mode]
       * 参数：
       * className：多个class空格隔开
       * mode：模式，
       *   1-默认，添加完class在动画结束时移除它(通常是添加animation型动画时)，
       *   2-添加完class动画结束后不移除该class(通常是添加transition型动画时),
       *   3-添加不含动画的普通class
       */
      var className = param.split(',')[0]
      var mode = param.split(',')[1] || '1'

      node.addClass(className)
      addedClass.push(className)
      node.off(compatEventName.animationEnd + eventNamespace) //防止重复添加事件
      node.off(compatEventName.transitionEnd + eventNamespace)

      //同个节点上多个when被触发时，有可能后面一个when触发时，前一个when动画还未结束，导致问题出现
      //解决方案：后一个when触发时，如果前一个when未结束，则进入等待区，等前一个when动画结束，再执行
      node.isAnimating = true //标识动画在进行中

      if (mode === '3') { //普通无动画的class，直接执行done
        done(event)
        node.isAnimating = false
      } else { //有动画的transition/animation动画完成执行回调
        function animateEnd(e) { //callback
          if (isAnimEndCallback) { //只执行一次动画结束的回调
            return
          }
          isAnimEndCallback = true
          if (mode !== '2') { //mode=1或默认时动画结束移除class
            node.removeClass(className)
            addedClass.splice(addedClass.indexOf(className), 1)
          }
          done(event)
          node.isAnimating = false
        }

        //动画结束
        node.on(compatEventName.animationEnd + eventNamespace, animateEnd)
        node.on(compatEventName.transitionEnd + eventNamespace, animateEnd)
      }
    })

    /**
     * 延迟等待
     */
    Animation.extend('wait', function(step, event) {
      var node = step.node
      var duration = step.param
      var done = step.done

      //标识动画在进行中
      node.isAnimating = true

      waitItv = setTimeout(function() {
        done(event)
        node.isAnimating = false
      }, duration)
    })

    /**
     * 增加内联样式
     * 添加的style如果没有animation/transition动画效果，请指定mode为3
     * 格式：
     *   style: transition width 0.5s, width 200px, [mode:1,2,3]
     *   mode:
     *     1- 默认,style在动画结束时移除掉
     *     2- 添加完style动画结束后不移除该style,
     *     3- 添加不含动画效果的style
     */
    Animation.extend('style', function(step, event) {
      var node = step.node
      var done = step.done
      var pairs = step.param.split(',')
      var styles = []
      var eventNamespace = step.instance._eventNamespace
      var mode = '1'
      var isAnimEndCallback = false

      //标识动画在进行中
      node.isAnimating = false

      if (!/\s+/.test($.trim(pairs[pairs.length - 1]))) {
        mode = $.trim(pairs.pop())
      }

      //支持多个内联样式，逗号分隔
      //exp: color red, display none;
      _.each(pairs, function(pair, i) {
        pair = $.trim(pair)
        var tmp = pair.split(/\s+/)
        styles.push({
          name: tmp.shift(),
          value: tmp.join(' ')
        })
      })

      _.each(styles, function(style, i) {
        node.css(style.name, style.value)
      })

      node.off(compatEventName.animationEnd + eventNamespace) //防止重复添加事件
      node.off(compatEventName.transitionEnd + eventNamespace)

      if (mode === '3') { //没有动画效果的样式
        done(event)
        node.isAnimating = false
      } else {

        function animateEnd(e) { //callback
          if (isAnimEndCallback) { //只执行一次动画结束的回调
            return
          }
          isAnimEndCallback = true
          if (mode !== '2') { ///mode=1或默认时动画结束移除style
            _.each(styles, function(style, i) {
              node.css(style.name, '')
            })
          }
          done(event)
          node.isAnimating = false
        }

        node.on(compatEventName.transitionEnd + eventNamespace, animateEnd)
        node.on(compatEventName.animationEnd + eventNamespace, animateEnd)
      }
    })

  }

  return extendCommand
});
/**
 * 初始化每个节点的动画配置
 * @param  {[type]} allDomEvents [description]
 * @param  {[type]} Loader)      {               function initAnimation(node) {    var self [description]
 * @return {[type]}              [description]
 */
define('initAnimation',[
  './constant'
], function(Constant) {

  /**
   * 解析bx-animation配置，挨个执行命令
   * 规则：
   *   - 分号分隔
   * @param  {dom} node 当前节点
   */
  function initAnimation(Animation, node) {
    var self = this
    var commands = node.attr(Constant.BX_ANIMATION_HOOK).split(';'); //分号分隔每条命令

    //去掉;结尾导致数组多余的一个空值
    if ($.trim(commands[commands.length - 1]) === '') {
      commands.pop()
    }

    // 返回命令function里的step，包含当前步骤的关键信息
    function getStep(item, i) {
      var command = $.trim(item) //trim处理下前后空格
      var commandExec = /^([^:]+)\:(.+)$/.exec(command)

      if (!commandExec || !commandExec[1] || !commandExec[2]) {
        return console.error('命令格式错误，参考格式： on:click; execute:dosomething(); class:tada;')
      }

      var commandName = $.trim(commandExec[1])
      var commandValue = $.trim(commandExec[2])

      var step = {
        instance: self, //当前动画实例
        command: commandName,
        node: node, //当前动画的节点
        index: i, //动画序列
        param: commandValue, //动画参数
        done: function(event, index) { //命令完成时调用done，来告诉系统执行下一个命令
          var _i = index || i // on事件时，重设 i 的值

          executeCommand(++_i, event) //执行下一个命令
        }
      }

      return step
    }

    //逐个执行命令
    function executeCommand(i, event) {
      // var callee = arguments.callee
      if (i > commands.length - 1) {
        i = 0
        return
      }

      //冒号分隔命令名与命令的参数
      var step = getStep(commands[i], i)
      var builtinCommand = Animation._builtinCommands[step.command]
      var whiteCommand = ['when'] //when命令不需要注册，也能自执行
      var isWhiteCommand = $.inArray(step.command, whiteCommand) > -1

      if (!builtinCommand && !isWhiteCommand) { // 未定义的命令抛错
        throw step.command + ' 该命令未定义'
        return
      }

      //执行命令代码
      if (!isWhiteCommand) {
        if (!step.node.isAnimating) {
          builtinCommand(step, event)
        } else {
          //如果前一个动画还未结束，则等待
          var itv = setInterval(function() {
            if (!step.node.isAnimating) {
              clearInterval(itv)
              builtinCommand(step, event)
            }
          }, 10)
        }
      }
    }

    /**
     * 将所有when自定义事件储存起来，等待触发
     */
    _.each(commands, function(item, i) {
      var step = getStep(item, i)

      //when命令缓存起来等待emit触发
      // ps: 不再共用on命令
      //     - 不必再枚举dom所有事件
      // if (step.command === 'on' && allDomEvents.indexOf(step.param) === -1) {
      // when可能存在多个相同的触发事件，_customEmits改为数组
      if (step.command === 'when') {
        if (step.instance._customEmits[step.param]) {
          step.instance._customEmits[step.param].push(step)
        } else {
          step.instance._customEmits[step.param] = [step]
        }
      }
    })

    //逐个执行命令
    executeCommand(0)
  }

  return initAnimation
});
/**
 * 主菜
 * @param  {[type]} $                [description]
 * @param  {[type]} _                [description]
 * @return {[type]}                  [description]
 */

define('animation',[
  'jquery',
  'underscore',
  './extendCommand',
  './initAnimation',
  './constant'
], function($, _, extendCommand, initAnimation, Constant) {

  /**
   * [Animation description]
   */
  function Animation(options) {
    var self = this

    //配置
    this.options = $.extend(true, {
      el: $('body'), //容器
      owner: {} //execute执行方法的宿主
    }, options)

    //内建的动画命令，可以this.extend(name, fn)扩展之
    // this._builtinCommands = {}

    //所有自定义待触发的事件
    this._customEmits = {}

    //所有事件代理的集合容器
    this._delegateEvents = []

    //每个animation实例拥有自己的事件命名空间
    //destroy时只销毁当前实例
    this._eventNamespace = '.' + (Math.random() + '').replace(/\D/g, '')

    //注册内建的命令
    extendCommand(Animation)

    //所有的带bx-animation的节点
    var allAnimNode = $(self.options.el).find('[' + Constant.BX_ANIMATION_HOOK + ']')

    //各节点进行动画绑定
    _.each(allAnimNode, function(node, i) {
      //解析bx-animation配置
      initAnimation.call(self, Animation, $(node))
    })

  }


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
  Animation._builtinCommands = {} //内建命令挂载在Animation全局，而不是挂载在实例上
  Animation.extend = function(name, fn) {
    Animation._builtinCommands[name] = fn
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
    }

  }

  return Animation
});
