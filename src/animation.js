define([
  'jquery',
  'underscore',
  'promise'
], function($, _, Promise) {

  function Animation() {

    //所有的带bx-animation的节点
    var allAnimNode = $('[bx-animation]')

    _.each(allAnimNode, function(node, i) {

      //解析bx-animation配置
      parseConfig(node)

    })

  }


  /**
   * 解析bx-animation配置
   * 规则：
   *   - 逗号分隔
   * @param  {string} configString 节点上的bx-animation字符串配置
   * @return {object}              返回对象类型配置
   */
  function parseConfig(node) {
    var commands = $(node).attr('bx-animation').split(';');


    //逐个执行命令
    (function(i) {
      var callee = arguments.callee
      if (i > commands.length - 1) {
        return
      }

      var command = commands[i]
      var commandName = command.split(':')[0]
      var commandValue = command.split(':')[1]
      configFunctions[commandName](node, commandValue, i, function(_i) {
        callee(++_i)
      })

    }(0))
  }

  /**
   * 命令处理
   * @type {Object}
   */
  var configFunctions = {
    'on': function(node, event, i, callback) {
      $(node).on(event, function() {
        callback(i)
      })
    },

    'class': function(node, className, callback) {
      $(node).addClass(className)
      setTimeout(function() {
        $(node).removeClass(className)
      }, 1000)
    }
  }

  return Animation
})