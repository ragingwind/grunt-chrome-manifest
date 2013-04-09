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

  var chromeManifest = {
    options: {
      src: 'app',
      dest: 'dist',
    },
    buildnumber: {
      update: true
    },
    usemin: {
      background: 'scripts/background.js'
    }
  };


  it('should works with manifest.json', function () {
    grunt.file.copy(path.join(__dirname, 'fixtures/manifest.json'), 'app/manifest.json');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('chromeManifest', chromeManifest);
    grunt.task.run('chromeManifest:usemin');
    grunt.task.start();

    var options = chromeManifest.options;
    var configs = gruntConfigs(options);
    var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));

    // check concat list
    _.each(configs.concat.background.src, function (script, i) {
      assert.equal(configs.concat.background.src[i], path.join(options.src, manifest.background.scripts[i]));
    });
    assert.equal(configs.concat.background.dest, path.join(options.dest, chromeManifest.usemin.background));

    assert.ok(configs.uglify[path.join(options.dest, chromeManifest.usemin.background)]);
    assert.equal(configs.uglify[path.join(options.dest, chromeManifest.usemin.background)], 'dist/scripts/background.js');

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

    // check updated manifest.json
    manifest = grunt.file.readJSON(path.join(options.dest, 'manifest.json'));
    assert.ok(manifest);
    assert.ok(manifest.background);
    assert.ok(manifest.background.scripts.length > 0);
    assert.equal(manifest.background.scripts[0], chromeManifest.usemin.background);

  });

  it('should change the buildnumber', function () {
    grunt.file.copy(path.join(__dirname, 'fixtures/manifest.json'), 'app/manifest.json');
    grunt.log.muted = false;
    grunt.config.init();
    grunt.config('chromeManifest', chromeManifest);
    grunt.task.run('chromeManifest:buildnumber');
    grunt.task.start();

    var manifest = grunt.file.readJSON(path.join(chromeManifest.options.src, 'manifest.json'));
    assert.equal(manifest.version, '0.0.2');
  });

});
