'use strict';
module.exports = function(grunt) {

  grunt.initConfig({
    daily: {
      options: {
        buildName: null
      }
    },
    publish: {
      options: {
        buildName: null
      }
    }
  })

  grunt.loadNpmTasks('magix-app-deploy') //支持grunt checkout, grunt daily, grunt publish三个命令
}