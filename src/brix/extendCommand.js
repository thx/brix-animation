/**
 * 所有内建的命令
 * @param  {[type]} $       [description]
 * @param  {[type]} _)      {               return Magix.View.extend({    init: function(e) {                 this.viewOptions [description]
 * @param  {[type]} render: function()    {                                var   self        [description]
 * @return {[type]}         [description]
 */
define([
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
        params = $.trim(/\((.+)\)/.exec(execute[2])[1]).split(/\s*\,\s*/)
      }

      //数据类型转化
      _.each(params, function(item, i) {
        try {
          params[i] = eval('(' + item + ')')
        } catch (err) {
          throw 'execute传参格式错误: ' + err.message
        }
      })

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
})