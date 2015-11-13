define([
  'jquery',
  'underscore',
  'promise'
], function($, _, Promise) {

  // 兼容动画事件
  var transitionEnd = 'transitionend';
  var animationEnd = 'animationend';
  var transitionProperty = 'transition';
  var animationProperty = 'animation';

  if (!('ontransitionend' in window)) {
    if ('onwebkittransitionend' in window) {

      // Chrome/Saf (+ Mobile Saf)/Android
      transitionEnd += ' webkitTransitionEnd';
      transitionProperty = 'webkitTransition'
    } else if ('onotransitionend' in dom.tNode || navigator.appName === 'Opera') {

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

    } else if ('onoanimationend' in dom.tNode) {
      // Opera
      animationEnd += ' oAnimationEnd';
      animationProperty = 'oAnimation';
    }
  }

  //所有dom节点支持的事件
  var testNode = document.createElement('div')
  var allDomEvents = [] //所有支持的dom事件集合
  var k
  for (k in testNode) {
    if (/^on/.test(k)) {
      allDomEvents.push(k.slice(2))
    }
  }

  //所有自定义待触发的事件
  var customEmits = {}


  /**
   * [Animation description]
   */
  function Animation() {
    /**
     * 内建的动画命令，可以this.register(name, fn)扩展之
     * @type {Object}
     */
    this.builtinCommands = {}
  }

  /**
   * Animation的所有方法
   * @type {Object}
   */
  Animation.prototype = {
    /**
     * 启动
     * @return {[type]} [description]
     */
    boot: function() {
      var self = this

      //注册内建的命令
      registerBuiltinCommand.call(self)

      //所有的带bx-animation的节点
      var allAnimNode = $('[bx-animation]')

      //各节点进行动画绑定
      _.each(allAnimNode, function(node, i) {

        //解析bx-animation配置
        initAnimation.call(self, $(node))

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
    register: function(name, fn) {
      this.builtinCommands[name] = fn
    }
  }

  /**
   * 注册内建的命令
   * @return {[type]} [description]
   */
  function registerBuiltinCommand() {
    var self = this
      //在事件触发时，需要清空已经添加上的样式名，回到初始化
    var addedClass = [] //已经添加的样式名数组
    var waitItv //setTimeout在on事件触发时被清除

    /**
     * 事件触发
     * dom事件绑定，同类型只能出现一次
     * 自定义事件需要emit触发
     */
    self.register('on', function(step) {
      var eventType = step.param
      var node = step.node
      var done = step.done
      var index = step.index

      if (allDomEvents.indexOf(eventType) > -1) { //dom事件
        node.on(eventType, function() {
          //on事件时清除setTimeout
          clearTimeout(waitItv)

          //清空附加上的class，初始化
          console.log(addedClass)
          addedClass.forEach(function(item, i) {
            node.removeClass(item)
          })
          addedClass = []

          done(index)
        })
      }
    })

    /**
     * 触发特定on事件，（dom事件除外）
     * @param  {[type]} step) {                     } [description]
     * @return {[type]}       [description]
     */
    self.register('emit', function(step) {
      var param = step.param
      var node = step.node
      var done = step.done

      //触发自定义的事件
      customEmits[param].done()

      //
      done()
    })

    /**
     * 添加样式
     */
    //一个class里不允许同时出现animation跟transition动画
    //请分两个class执行
    //动画结束回调只会执行一次
    self.register('class', function(step) {
      var param = step.param
      var node = step.node
      var done = step.done

      var isAnimEndCallback = false

      /**
       * className格式：class:className,[mode]
       * 参数：
       * className：多个class空格隔开
       * mode：模式，
       *   1-默认，添加完class在动画结束时移除它，
       *   2-添加完class后不移除该class,
       *   3-添加不含动画的普通class
       */
      var className = param.split(',')[0]
      var mode = param.split(',')[1]

      node.addClass(className)
      addedClass.push(className)
      node.off(animationEnd + '.bxAnimation') //防止重复添加事件
      node.off(transitionEnd + '.bxAnimation')

      if (mode === '3') { //普通无动画的class，直接执行done
        done()
      } else { //有动画的transition/animation动画完成执行回调
        function animateEnd(e) { //callback
          if (isAnimEndCallback) { //只执行一次动画结束的回调
            return
          }
          isAnimEndCallback = true
          if (mode !== '2') { //mode===2动画结束移除class
            node.removeClass(className)
            addedClass.splice(addedClass.indexOf(className), 1)
          }
          done()
        }

        //动画结束
        node.on(animationEnd + '.bxAnimation', animateEnd)
        node.on(transitionEnd + '.bxAnimation', animateEnd)
      }
    })

    /**
     * 延迟等待
     */
    self.register('wait', function(step) {
      var node = step.node
      var duration = step.param
      var done = step.done

      waitItv = setTimeout(function() {
        done()
      }, duration)
    })

    /**
     * 增加内联样式
     * 添加的style如果没有animation/transition动画效果，请指定mode为3
     * 格式：
     *   style: transition: width 0.5s, width 200px, 3
     */
    self.register('style', function(step) {
      var node = step.node
      var done = step.done
      var pairs = step.param.split(',')
      var styles = []
      var mode
      var isAnimEndCallback = false

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

      if (mode === '3') { //没有动画效果的样式
        done()
      } else {

        function animateEnd(e) { //callback
          if (isAnimEndCallback) { //只执行一次动画结束的回调
            return
          }
          isAnimEndCallback = true
          done()
        }

        node.on(transitionEnd + '.bxAnimation', animateEnd)
        node.on(animationEnd + '.bxAnimation', animateEnd)
      }
    })

  }


  /**
   * 解析bx-animation配置，挨个执行命令
   * 规则：
   *   - 分号分隔
   * @param  {dom} node 当前节点
   */
  function initAnimation(node) {
    var self = this
    var commands = node.attr('bx-animation').split(';'); //分号分隔每条命令

    //去掉;结尾导致数组多余的一个空值
    if ($.trim(commands[commands.length - 1]) === '') {
      commands.pop()
    }

    //
    function getStep(item, i) {
      var command = $.trim(item) //trim处理下前后空格
      var commandName = $.trim(command.split(':')[0])
      var commandValue = $.trim(command.split(':')[1])
      var step = {
        command: commandName,
        node: node, //当前动画的节点
        index: i, //动画序列
        param: commandValue, //动画参数
        done: function(index) { //命令完成时调用done，来告诉系统执行下一个命令
          var _i = index || i // on事件时，重设 i 的值

          excuteCommand(++_i) //执行下一个命令
        }
      }

      return step
    }

    //逐个执行命令
    function excuteCommand(i) {
      // var callee = arguments.callee
      if (i > commands.length - 1) {
        i = 0
        return
      }

      //冒号分隔命令名与命令的参数
      var step = getStep(commands[i], i)
      var builtinCommand = self.builtinCommands[step.command]
      if (!builtinCommand) { // 未定义的命令抛错
        throw step.command + ' 该命令未定义'
        return
      }

      //执行命令代码
      setTimeout(function() { //setTimeout解决context环境问题
        builtinCommand(step, {})
      }, 0)
    }

    /**
     * 将所有on自定义事件储存起来，等待触发
     */
    commands.forEach(function(item, i) {
      var step = getStep(item, i)

      //自定义on事件
      if (step.command === 'on' && allDomEvents.indexOf(step.param) === -1) {
        customEmits[step.param] = step
      }
    })

    //逐个执行命令
    excuteCommand(0)

  }

  return Animation
})