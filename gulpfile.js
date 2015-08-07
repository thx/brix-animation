var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');

gulp.task('less', function() {
  return gulp.src('./docs/less/**/*.less')
    .pipe(less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(gulp.dest('./dist/css'));
})

gulp.task('default', ['less'], function() {
  return gulp.watch('./docs/less/**/*.less', ['less'])
})