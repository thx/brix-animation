/**
 * 所有内建的命令
 * @param  {[type]} $       [description]
 * @param  {[type]} _)      {               return Magix.View.extend({    init: function(e) {                 this.viewOptions [description]
 * @param  {[type]} render: function()    {                                var   self        [description]
 * @return {[type]}         [description]
 */
define([
  'jquery',
  './compatEventName',
  './constant'
], function($, compatEventName, Constant) {

  /**
   * 注册内建的命令
   * @return {[type]} [description]
   */
  function extendCommand(Animation) {

    /**
     * 事件触发
     * dom事件绑定，同类型只能出现一次
     * 自定义事件需要emit触发
     * mode =
     *   1: (默认) 重复点击事件直接重置动画, 含清除setTimeout, 清除所添加的class，但style样式不清除
     *   2: 重复点击事件需等待动画结束；
     */
    Animation.extend('on', function(step) {
      var eventParse = step.param.split(',')
      var eventType = eventParse[0].trim()
      // var eventMode = eventParse[1] && eventParse[1].trim() //1(默认)：重复点击事件直接重置动画；2：重复点击事件需等待动画结束；
      var node = step.node
      var done = step.done
      var index = step.index
      var $body = $(document.body)
      var eventName = eventType + step.instance._eventNamespace

      //事件代理到body根节点
      $body.on(eventName, '[' + Constant.BX_ANIMATION_HOOK + ']', function(e) {
        if (node[0] === e.currentTarget) {

          // if (eventMode === '2' && node.isAnimating) {
          if (node.isAnimating) {
            //动画进行中，再次on事件不生效
            return
          }

          //on事件时清除setTimeout
          // clearTimeout(node.waitItv)

          //清空附加上的class，初始化
          // console.log('addedClass', node.addedClass)
          // if (node.addedClass) {
          //   node.addedClass.forEach(function(className, i) {
          //     node.removeClass(className)
          //   })
          // }
          // node.addedClass = []

          //清空附加上的styles样式，初始化
          // console.log('addedStyles', node.addedStyles)
          // if (node.addedStyles) {
          //   node.addedStyles.forEach(function(style, i) {
          //     node.css(style.name, '')
          //   })
          // }
          // node.addedStyles = []

          //动画状态复位
          // node.isAnimating = false

          //next
          done(e, index)
        }
      })

      if (step.instance._delegateEvents.indexOf(eventName) === -1) {
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
      var param = step.param.trim()
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
        params = eval('([' + /\((.+)\)/.exec(execute[2])[1].trim() + '])')
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
          if ((typeof isStop === 'object') && isStop.then) {

            isStop.then(function(param) {
              if (param !== false) { //函数返回false会中断动画流程
                node.isAnimating = false
                done(event)
              }
            })
          }

          //如果return false，会中断后续动效
          else if (isStop !== false) {
            node.isAnimating = false
            done(event)
          }
        } else {
          throw '方法：' + func + '不存在'
        }
      } else {
        node.isAnimating = false
        done(event)
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
      var whenNames = param.split(',')

      whenNames.forEach(function(name) {
        name = name.trim()

        //触发自定义的事件
        var _customEmits = step.instance._customEmits[name] || []
        _customEmits.forEach(function(_step) {
          _step.done()
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

        // var animIndex = node.animQueue.length - 1 //当前执行到节点的第几个动画下标

      /**
       * className格式：class:className,[mode]
       * 参数：
       * className：多个class空格隔开
       * mode：模式，
       *   1-默认，添加完class在动画结束时移除它(通常是添加animation型动画时)，
       *   2-添加完class动画结束后不移除该class(通常是添加transition型动画时),
       *   3-添加不含动画的普通class
       */
      var className = param.split(',')[0].trim()
      var mode = (param.split(',')[1] || '1').trim()

      node.addClass(className)
        //
      // if (node.addedClass) {
      //   node.addedClass.push(className)
      // } else {
      //   node.addedClass = [className]
      // }

      node.off(compatEventName.animationEnd + eventNamespace) //防止重复添加事件
      node.off(compatEventName.transitionEnd + eventNamespace)

      //同个节点上多个when被触发时，有可能后面一个when触发时，前一个when动画还未结束，导致问题出现
      //解决方案：后一个when触发时，如果前一个when未结束，则进入等待区，等前一个when动画结束，再执行
      node.isAnimating = true //标识动画在进行中

      if (mode === '3') { //普通无动画的class，直接执行done
        node.isAnimating = false
        done(event)
          // node.animIndex = animIndex
      } else { //有动画的transition/animation动画完成执行回调
        function animateEnd(e) { //callback
          if (!node.isAnimating) { //只执行一次动画结束的回调
            return
          }

          if (mode !== '2') { //mode=1或默认时动画结束移除class
            node.removeClass(className)
            // node.addedClass.splice(node.addedClass.indexOf(className), 1)
          }
          node.isAnimating = false
          done(event)
            // node.animIndex = animIndex
        }

        //动画结束
        node.on(compatEventName.animationEnd + eventNamespace, animateEnd)
        node.on(compatEventName.transitionEnd + eventNamespace, animateEnd)
      }
    })


    /**
     * 移除样式
     * @param  {[type]} step
     * @param  {[type]} event) {               }
     * @return {[type]}
     */
    Animation.extend('removeClass', function(step, event) {
      var param = step.param
      var node = step.node
      var done = step.done
      var eventNamespace = step.instance._eventNamespace

      var className = param.split(',')[0].trim()
      var mode = (param.split(',')[1] || '1').trim()

      node.removeClass(className)

      node.off(compatEventName.animationEnd + eventNamespace) //防止重复添加事件
      node.off(compatEventName.transitionEnd + eventNamespace)

      //同个节点上多个when被触发时，有可能后面一个when触发时，前一个when动画还未结束，导致问题出现
      //解决方案：后一个when触发时，如果前一个when未结束，则进入等待区，等前一个when动画结束，再执行
      node.isAnimating = true //标识动画在进行中

      if (mode === '3') { //普通无动画的class，直接执行done
        node.isAnimating = false
        done(event)
      } else { //有动画的transition/animation动画完成执行回调
        function animateEnd(e) { //callback
          if (!node.isAnimating) { //只执行一次动画结束的回调
            return
          }
          node.isAnimating = false
          done(event)
        }

        //动画结束
        node.on(compatEventName.animationEnd + eventNamespace, animateEnd)
        node.on(compatEventName.transitionEnd + eventNamespace, animateEnd)
      }

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
      var eventNamespace = step.instance._eventNamespace
      var mode = '1'

      //添加的样式
      var addedStyles = []

      //标识动画在进行中
      node.isAnimating = true

      if (!/\s+/.test(pairs[pairs.length - 1].trim())) {
        mode = pairs.pop().trim()
      }

      //支持多个内联样式，逗号分隔
      //exp: color red, display none;
      pairs.forEach(function(pair, i) {
        pair = pair.trim()
        var tmp = pair.split(/\s+/)
        addedStyles.push({
          name: tmp.shift(),
          value: tmp.join(' ')
        })
      })

      addedStyles.forEach(function(style, i) {
        node.css(style.name, style.value)
      })

      node.off(compatEventName.animationEnd + eventNamespace) //防止重复添加事件
      node.off(compatEventName.transitionEnd + eventNamespace)

      if (mode === '3') { //没有动画效果的样式
        node.isAnimating = false
        done(event)
      } else {

        function animateEnd(e) { //callback
          if (!node.isAnimating) { //只执行一次动画结束的回调
            return
          }

          if (mode !== '2') { ///mode=1或默认时动画结束移除style
            addedStyles.forEach(function(style, i) {
              node.css(style.name, '')
            })
          }
          node.isAnimating = false
          done(event)
        }

        node.on(compatEventName.transitionEnd + eventNamespace, animateEnd)
        node.on(compatEventName.animationEnd + eventNamespace, animateEnd)
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
      node.waitItv = setTimeout(function() {
        node.isAnimating = false
        done(event)
      }, duration)
    })

  }

  return extendCommand
})