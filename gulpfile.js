var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var install = require("gulp-install");
var notify = require("gulp-notify");
var merge = require("merge-stream");
var imagemin = require("gulp-imagemin");
var autoprefixer = require('gulp-autoprefixer');
var spritesmith = require('gulp.spritesmith');

var settings = {
  domain: '',
};

var paths = {
  images_directory: 'images',
  css_directory: 'css',
  sass_directory: 'scss',
  js_directory: 'js',
};

paths.images = [paths.images_directory + '/**/*.png'];
paths.scss = [paths.sass_directory + '/**/*.scss'];
paths.css = [paths.css_directory + '/**/*.css'];
paths.scripts = [paths.js_directory + '/**/*.js'];

// Run an npm install
gulp.task('install', function () {
  return gulp.src(['./bower.json', './package.json'])
    .pipe(install());
});

// Task to start the browser-sync server and watch for changed files
gulp.task('browser-sync', function () {
  var browserSyncSettings = {
    logSnippet: false,
    open: false,
    ghostMode: false,
    files: paths.css.concat(paths.scripts)
  };

  if (settings.domain.length > 0) {
    browserSyncSettings.proxy = settings.domain;
  } else {
    // Treat like a server
    browserSyncSettings.server = {
      baseDir : '.'
    };

    browserSyncSettings.open = true;
  }

  return browserSync(browserSyncSettings);
});

// Spriting
gulp.task('sprite', function () {
  // Generate our spritesheet
  var spriteData = gulp.src(paths.images).pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss'
  }));

  // Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
    .pipe(imagemin())
    .pipe(gulp.dest(paths.css_directory));

  var cssStream = spriteData.css
    .pipe(gulp.dest(paths.sass_directory));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
});

// Task to compile using compass
gulp.task('styles', ['sprite'], function () {
  return gulp.src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass({
      precision: 7
    }))
    .on('error', notify.onError({
      message: function(error) {
        return error.message;
      }
    }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.css_directory));
});

// Watch for files and run the appropriate task
gulp.task('watch', function () {
  gulp.watch(paths.images_directory, ['styles']);
  gulp.watch(paths.scss, ['styles']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['install', 'styles', 'watch', 'browser-sync']);
