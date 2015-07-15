// TODO: version
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    gulpif = require('gulp-if'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),

    fs = require('fs'),

    env = process.env.NODE_ENV || 'dev',

    // https://www.npmjs.com/package/yargs
    argv = require('yargs')
        .usage('Usage: $0 -v --js_src --css_src --build_dir')
        .demand(['js_src','build_dir'])
        .argv,

    // The order is very important due to some dependencies between scripts, so specify the dependency order here.
    dependencies = [
        'Pete.prototype.js',
        'Pete.js',
        'Pete.Observer.js',
        'Pete.Element.js',
        'Pete.Composite.js'
    ],

    build_dir = argv.build_dir,
    js_src = argv.js_src,

    // Here we need to make sure the order of the scripts is correct (the dependencies MUST be first).
    files = dependencies.concat(fs.readdirSync(js_src).filter(function (f) {
        return dependencies.indexOf(f) === -1;
    }));

// Prepend every file name with the source destination.
function map(v) {
    // Add the trailing backslash, if needed.
    v += (v.lastIndexOf('/') === v.length - 1) ? '' : '/';

    return files.map(function (f) {
        return v + f;
    });
}

gulp.task('js', function () {
    return gulp.src(map(js_src))
        .pipe(concat('pete.js'))
        .pipe(gulpif(env === 'prod', uglify()))
        .pipe(gulp.dest(build_dir));
});

gulp.task('sass', function () {
    var css_src = argv.css_src,
        cfg = {};

    if (css_src) {
        // Let's reuse the 'files' var here.
        files = fs.readdirSync(css_src);

        // Turn on source maps (or not).
        if (env === 'prod') {
            cfg.outputStyle = 'compressed';
        } else {
            cfg.sourceComments = 'map';
        }

        return gulp.src(map(css_src))
            .pipe(concat('pete.css'))
            .pipe(sass(cfg))
            .pipe(gulp.dest(build_dir));
    }
});

gulp.task('default', ['js', 'sass']);

