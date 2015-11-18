'use strict';
module.exports = function(grunt) {

  grunt.initConfig({
    daily: {
      options: {
        buildName: 'uglify'
      }
    },
    publish: {
      options: {
        buildName: 'uglify'
      }
    },
    uglify: {
      target: {
        files: [{
          ext: '-min.js',
          expand: true,
          cwd: 'src/',
          src: '**/*.js',
          dest: 'dist/js'
        }]
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('magix-app-deploy') //支持grunt checkout, grunt daily, grunt publish三个命令
}