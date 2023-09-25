const path = require('path');
const { src, dest, series, parallel, watch } = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('node-sass'));
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();

const jsMainFiles = [
  './dev/js/main/main.map-data.js',
  './dev/js/main/main.map-render.js',
  './dev/js/main/main.controls.js',
  './dev/js/main/main.select-maps.js',
  './dev/js/main/main.drawing.js',
  './dev/js/main/main.sessions.js',
  './dev/js/main/main.js',
];

const jsCommonFiles = [
  './dev/js/common/common.global.js',
  './dev/js/common/common.helpers.js',
  './dev/js/lang-terms/lang-terms.js',
  './dev/js/lang-terms/lang-terms.*.js',
];

const jsAboutFiles = [
  './dev/js/about/about.js',
];

const jsStatsFiles = [
  './dev/js/stats/stats.meta-data.js',
  './dev/js/stats/stats.render.js',
  './dev/js/stats/stats.controls.js',
  './dev/js/stats/stats.operators.data.js',
  './dev/js/stats/stats.map.data.js',
  './dev/js/stats/stats.api.js',
  './dev/js/stats/stats.map.render.js',
  './dev/js/stats/stats.operators.render.js',
  './dev/js/stats/stats.operators.chart.js',
  './dev/js/stats/stats.js',
];

const scssMainFile = './dev/scss/main/main.scss';
const scssAboutFile = './dev/scss/about/about.scss';
const scssStatsFile = './dev/scss/stats/stats.scss';
const scssImportedFiles = './dev/scss/**/_*.scss';

function buildJs(name, files) {
  return src(files)
    .pipe(concat(`${name}.js`))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('./', { sourceMappingUrl: () => { return `${name}.min.js.map` } }))
    .pipe(dest(path.join('site', 'js', `release.${process.env.npm_package_version}`)));
}

function buildCss(name, file) {
  return src(file)
    .pipe(sass().on('error', sass.logError))
    .pipe(rename({ extname: `.${process.env.npm_package_version}.css` }))
    .pipe(dest(path.join('site', 'css', `release.${process.env.npm_package_version}`)));
}

function buildJsMain() {
 return buildJs('main', jsMainFiles);
}

function buildJsCommon() {
  return buildJs('common', jsCommonFiles);
}

function buildJsAbout() {
  return buildJs('about', jsAboutFiles);
}

function buildJsStats() {
  return buildJs('stats', jsStatsFiles);
}

function buildCssMain() {
  return buildCss('main', scssMainFile);
}

function buildCssAbout() {
  return buildCss('about', scssAboutFile);
}

function buildCssStats() {
  return buildCss('stats', scssStatsFile);
}

function bsInit(cb) {
  browserSync.init({
    server: './site',
  });
  cb();
}

function bsReload(cb) {
  watch('site/**/*').on('change', browserSync.reload);
  cb();
}

function bsInject(cb) {
  browserSync.stream();
  cb();
}

function watchAndBuild(cb) {
  watch(jsMainFiles, buildJsMain);
  watch(jsCommonFiles, buildJsCommon);
  watch(jsAboutFiles, buildJsAbout);
  watch(jsStatsFiles, buildJsStats);
  watch(scssMainFile, buildCssMain);
  watch(scssAboutFile, buildCssAbout);
  watch(scssStatsFile, buildCssStats);
  // scss file may include other scss files
  watch(scssImportedFiles, parallel(buildCssMain, buildCssAbout, buildCssStats));
  cb();
}


const build = parallel(
  buildJsMain, buildJsCommon, buildJsAbout, buildJsStats,
  buildCssMain, buildCssAbout, buildCssStats,
);

const dev = series(
  build,
  bsInit,
  parallel(
    watchAndBuild,
    bsReload,
  ),
);

exports.build = build;
exports.dev = dev;
