var gulp    = require('gulp');
var env     = require('gulp-env');
var babel   = require('gulp-babel');
var mocha   = require('gulp-mocha');
var del     = require('del');

gulp.task('clean', function (cb) {
    del(['lib/**/*', '!lib/.gitignore'], cb);
});

gulp.task('copyTemplates', ['clean'], function () {
	return gulp.src('src/templates/*').pipe(gulp.dest('lib/templates'));
});

gulp.task('build', ['copyTemplates'], function () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('src/*.js', ['build']);
});

gulp.task('test', ['build'], function () {
	env({
		// We will, we will mock you!  Build emails but prevent send attempt so
		// this works out of the box without SMTP config.
		vars: { 'TESTCAFE_SMTP_SMTPHOST': 'unit-test-mock' }
	});
    return gulp
        .src('test/**.js')
        .pipe(mocha({
            ui:       'bdd',
            reporter: 'spec',
            timeout:  typeof v8debug === 'undefined' ? 2000 : Infinity // NOTE: disable timeouts in debug
        }));
});

gulp.task('preview', ['build'], function () {
    var buildReporterPlugin = require('testcafe').embeddingUtils.buildReporterPlugin;
    var pluginFactory       = require('./lib');
    var reporterTestCalls   = require('./test/utils/reporter-test-calls');
    var plugin              = buildReporterPlugin(pluginFactory);

    reporterTestCalls.forEach(function (call) {
        plugin[call.method].apply(plugin, call.args);
    });

    process.exit(0);
});
