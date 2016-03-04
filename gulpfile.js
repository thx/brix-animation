/* global require, console */
var gulp = require('gulp')
var through = require('through2')
var connect = require('gulp-connect')
var jshint = require('gulp-jshint')
var webpack = require("webpack")
var rjs = require('gulp-requirejs')
var uglify = require('gulp-uglify')
    // var mochaPhantomJS = require('gulp-mocha-phantomjs')
var exec = require('child_process').exec
var less = require('gulp-less');
var path = require('path');
var globs = ['src/**/*.js', 'docs/less/**/*.less']
    // var watchTasks = ['hello', 'madge', 'jshint', 'rjs', 'compress', 'test']
var watchTasks = ['hello', 'rjs', 'compress' /*, 'less'*/ ]

gulp.task('hello', function() {
    console.log((function() {
        /*
    _          _               _    _
   /_\   _ _  (_) _ __   __ _ | |_ (_) ___  _ _
  / _ \ | ' \ | || '  \ / _` ||  _|| |/ _ \| ' \
 /_/ \_\|_||_||_||_|_|_|\__,_| \__||_|\___/|_||_|
        */
    }).toString().split('\n').slice(2, -2).join('\n') + '\n')
})

// https://github.com/AveVlad/gulp-connect
gulp.task('connect', function() {
    connect.server({
        port: 4246,
        middleware: function( /*connect, opt*/ ) {
            return [
                // https://github.com/senchalabs/connect/#use-middleware
                /* jshint unused:true */
                function cors(req, res, next) {
                    if (req.method === 'POST') req.method = 'GET'
                    next()
                }
            ]
        }
    })
})

// https://github.com/spenceralger/gulp-jshint
gulp.task('jshint', function() {
    return gulp.src(globs)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
})


// https://github.com/RobinThrift/gulp-requirejs
// http://requirejs.org/docs/optimization.html#empty
gulp.task('rjs', function() {
    var build = {
        baseUrl: 'src',
        name: 'brix/animation',
        out: 'dist/animation-debug.js',
        paths: {
            jquery: 'empty:',
            underscore: 'empty:'
        }
    }
    rjs(build)
        .pipe(gulp.dest('.')) // pipe it to the output DIR
})

// https://github.com/floatdrop/gulp-watch
gulp.task('watch', function( /*callback*/ ) {
    gulp.watch(globs, watchTasks)
})

// https://github.com/mrhooray/gulp-mocha-phantomjs
// gulp.task('test', function() {
//     return gulp.src('test/*.html')
//         .pipe(mochaPhantomJS({
//             reporter: 'spec'
//         }))
// })

// https://github.com/terinjokes/gulp-uglify
gulp.task('compress', function() {
    // gulp.src(['dist/**-debug.js'])
    //     .pipe(uglify())
    //     .pipe(gulp.dest('dist/'))

    // gulp.src(['dist/**.js','!dist/**-debug.js'])
    //     .pipe(through.obj(function(file, encoding, callback) { /* jshint unused:false */
    //         file.path = file.path.replace(
    //             '.js',
    //             '-debug.js'
    //         )
    //         callback(null, file)
    //     }))
    //     .pipe(gulp.dest('dist/'))
    gulp.src(['dist/**-debug.js'])
        .pipe(uglify())
            .pipe(through.obj(function(file, encoding, callback) { /* jshint unused:false */
            file.path = file.path.replace(
                '-debug.js',
                '.js'
            )
            callback(null, file)
        }))
        .pipe(gulp.dest('dist/'))
})

// https://github.com/pahen/madge
gulp.task('madge', function( /*callback*/ ) {
    exec('madge --format amd ./src/',
        function(error, stdout /*, stderr*/ ) {
            if (error) console.log('exec error: ' + error)
            console.log('module dependencies:')
            console.log(stdout)
        }
    )
    exec('madge --format amd --image ./doc/dependencies.png ./src/',
        function(error /*, stdout, stderr*/ ) {
            if (error) console.log('exec error: ' + error)
        }
    )
})

gulp.task('default', watchTasks.concat(['watch']))

gulp.task('watchrjs', function() {
    gulp.watch(globs, ['rjs'])
})

gulp.task('less', function() {
    return gulp.src('./docs/less/**/*.less')
        .pipe(less({
            paths: [path.join(__dirname, 'less', 'includes')]
        }))
        .pipe(gulp.dest('./docs/less'));
})