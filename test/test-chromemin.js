'use strict';
var path = require('path');
var assert = require('assert');
var grunt = require('grunt');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

grunt.task.init([]);
grunt.config.init({});

var opts = grunt.cli.options;
opts.redirect = !opts.silent;

var directory = function directory(dir) {
  return function directory(done) {
    process.chdir(__dirname);
    rimraf(dir, function (err) {
      if (err) {
        return done(err);
      }
      mkdirp(dir, function (err) {
        if (err) {
          return done(err);
        }
        process.chdir(dir);
        done();
      });
    });
  };
};

var gruntConfigs = function (options) {
  var configs = {};
  configs.uglifyName = options.uglify || 'uglify';
  configs.cssminName = options.cssmin || 'cssmin';
  return {
    concat: grunt.config('concat') || {},
    uglify: grunt.config(configs.uglifyName) || {},
    cssmin: grunt.config(configs.cssminName) || {}
  };
};

var _ = grunt.util._;

describe('chrome', function () {

  before(directory('temp'));

  var chromemin = {
    options: {
      src: 'app',
      dest: 'dist',
      background: 'scripts/background.js'
    },
    prepare: {
      buildnumber: true,
    },
    dist: {
      compress: 'package/miznet.zip'
    }
  };


  it('should update the grung configs. concat, uglify and cssmin', function () {
    grunt.file.copy(path.join(__dirname, 'fixtures/manifest.json'), 'app/manifest.json');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('chromemin', chromemin);
    grunt.task.run('chromemin:prepare');
    grunt.task.start();

    var options = chromemin.options;
    var configs = gruntConfigs(options);
    var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));

    // check concat list
    assert.equal(configs.concat.background.src, path.join(options.dest, options.background));
    _.each(configs.concat.background.dest, function (script, i) {
      assert.equal(configs.concat.background.dest[i], manifest.background.scripts[i]);
    });

    assert.ok(configs.uglify[path.join(options.dest, options.background)]);
    assert.equal(configs.uglify[path.join(options.dest, options.background)], 'dist/scripts/background.js');

    for (var cs = 0, max = manifest.content_scripts.length; cs < max; ++cs) {
      var file, dest;
      // check uglify list
      for (var i = 0, csmax = manifest.content_scripts[cs].js.length; i < csmax; ++i) {
        file = 'scripts/contentscript-' + parseInt(cs, 10) + parseInt(i, 10) + '.js';
        dest = path.join(options.dest, file);
        assert.ok(configs.uglify[dest]);
        assert.equal(configs.uglify[dest], path.join(options.src, file));
      }

      // check cssmin list
      for (i = 0, max = manifest.content_scripts[cs].css.length; i < max; ++i) {
        file = 'styles/contentstyle-' + parseInt(cs, 10) + parseInt(i, 10) + '.css';
        dest = path.join(options.dest, file);
        assert.ok(configs.cssmin[dest]);
        assert.equal(configs.cssmin[dest], path.join(options.src, file));
      }
    }
  });

  it('should update manifest file', function () {
    grunt.file.copy(path.join(__dirname, 'fixtures/manifest.json'), 'app/manifest.json');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('chromemin', chromemin);
    grunt.task.run('chromemin:dist');
    grunt.task.start();

    var options = chromemin.options;
    var manifest = grunt.file.readJSON(path.join(options.dest, 'manifest.json'));
    var compress = grunt.config('compress');

    assert.equal(manifest.version, '0.0.2');
    assert.ok(manifest.background);
    assert.ok(manifest.background.scripts.length > 0);
    assert.equal(manifest.background.scripts[0], path.join(options.dest, options.background));

    assert.ok(compress);
    assert.equal(compress.dist.options.archive, chromemin.dist.compress);
    assert.equal(compress.dist.files[0].cwd, options.dest);
  });

});
