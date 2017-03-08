/**
 * 初始化每个节点的动画配置
 * @param  {[type]} allDomEvents [description]
 * @param  {[type]} Loader)      {               function initAnimation(node) {    var self [description]
 * @return {[type]}              [description]
 */
define([
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
      var commandName = $.trim(command.split(':')[0])
      var commandValue = $.trim(command.split(':')[1])
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
        setTimeout(function() { //setTimeout解决context环境问题
          builtinCommand(step, event)
        }, 0)
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
})