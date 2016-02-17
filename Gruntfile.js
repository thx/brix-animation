'use strict';
module.exports = function(grunt) {

  grunt.initConfig({
    daily: {
      options: {
        buildName: 'build'
      }
    },
    publish: {
      options: {
        buildName: 'build'
      }
    },
    copy: {
      target: {
        files: [{
          // ext: '-min.js',
          expand: true,
          cwd: 'src/',
          src: '**/*.js',
          dest: 'dist/js'
        }]
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

  grunt.registerTask('build', ['copy', 'uglify'])
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('magix-app-deploy') //支持grunt checkout, grunt daily, grunt publish三个命令
}