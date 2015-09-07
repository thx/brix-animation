define([
  'jquery',
  'underscore',
  'promise'
], function($, _, Promise) {

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

    /**
     * dom事件触发
     * on事件同类型只能出现一次
     */
    self.register('on', function(step) {
      var eventType = step.param
      var node = step.node
      var done = step.done

      node.on(eventType, function() {
        done(step.index)
      })
    })

    /**
     * 添加样式
     */
    self.register('class', function(step) {
      var param = step.param
      var node = step.node
      var done = step.done
      var className = param.split(',')[0]
      var mode = param.split(',')[1]

      node.addClass(className)
      node.off('animationend.bxAnimation') //防止重复添加事件
        //动画结束
      node.on('animationend.bxAnimation', function() {
        node.removeClass(className)
        done()
      })
    })

    /**
     * 延迟等待
     */
    self.register('wait', function(step) {
      var node = step.node
      var duration = step.param
      var done = step.done

      setTimeout(function() {
        done()
      }, duration)
    })

    /**
     * 移除样式
     */
    self.register('removeClass', function(step) {
      var node = step.node
      var className = step.param
      var done = step.done

      node.removeClass(className)
      done()
    })

    /**
     * 增加内联样式
     */
    self.register('style', function(step) {
      var node = step.node
      var done = step.done
      var pairs = step.param.split(',')
      var styles = []

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
      done()
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

    //逐个执行命令
    (function(i) {
      var callee = arguments.callee
      if (i > commands.length - 1) {
        i = 0
        return
      }

      //冒号分隔命令名与命令的参数
      var command = $.trim(commands[i]) //trim处理下前后空格
      var commandName = $.trim(command.split(':')[0])
      var commandValue = $.trim(command.split(':')[1])

      //每个命令执行时的参数
      var step = {
        node: node, //当前动画的节点
        index: i, //动画序列
        param: commandValue, //动画参数
        done: function(index) { //命令完成时调用done，来告诉系统执行下一个命令
          var _i = index || i // on事件时，重设 i 的值

          callee(++_i) //执行下一个命令
        }
      }

      var builtinCommand = self.builtinCommands[commandName]
      if (!builtinCommand) { // 未定义的命令抛错
        throw commandName + ' 该命令未定义'
        return
      }

      //执行命令代码
      builtinCommand(step)

    }(0))
  }

  return Animation
})