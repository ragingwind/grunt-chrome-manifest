'use strict';

var path = require('path');

module.exports = function (grunt) {

  var _ = grunt.util._;

  var targets = {
    configs: function (options) {
      var configs = {};
      configs.uglifyName = options.uglify || 'uglify';
      configs.cssminName = options.cssmin || 'cssmin';
      configs.concat = grunt.config('concat') || {};
      configs.uglify = grunt.config(configs.uglifyName) || {};
      configs.cssmin = grunt.config(configs.cssminName) || {};
      configs.update = function () {
        grunt.config('concat', this.concat);
        grunt.config(this.cssminName, this.cssmin);
        grunt.config(this.uglifyName, this.uglify);
      };
      return configs;
    },

    // auto increment build version in manifest.json.
    // if you want more information please visit to
    // http://developer.chrome.com/extensions/manifest.html#version
    buildnumber: function (task) {
      var options = task.options();
      var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));
      var buildnumber = manifest.version.split('.');
      var numberup = function (numbers, index) {
        var number = numbers[index];
        if (number) {
          if (number + 1 <= 65535) {
            numbers[index]++;
            return numbers.join('.');
          } else {
            numberup(numbers, ++index);
          }
        } else {
          throw 'Task could not update build number ' + buildnumber;
        }
      };
      manifest.version = numberup(buildnumber, buildnumber.length - 1);
      grunt.file.write(path.join(options.src, 'manifest.json'), JSON.stringify(manifest, null, 2));
    },

    // usemin task for scripts and css files in manifest.
    // get scripts/css file list from manifest to handle, and initialize
    // the grunt configuration appropriately, and automatically.
    // then replaces references to non-optimized scripts into background scripts.
    usemin: function (task) {
      var options = task.options();
      var configs = targets.configs(options);
      var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));
      var background = path.join(options.dest, task.data.background || 'background.js');

      // update concat config for scripts in background field.
      configs.concat.background = {
        src: [],
        dest: background
      };

      _.each(manifest.background.scripts, function (script) {
        configs.concat.background.src.push(path.join(options.src, script));
      });

      // update uglify config for concated background.js.
      configs.uglify[background] = background;

      // update uglify and css config for content scripts field.
      _.each(manifest.content_scripts, function (contentScript) {
        _.each(contentScript.js, function (js) {
          configs.uglify[path.join(options.dest, js)] = path.join(options.src, js);
        });

        _.each(contentScript.css, function (css) {
          configs.cssmin[path.join(options.dest, css)] = path.join(options.src, css);
        });
      });

      // update changed grunt configs.
      configs.update();

      // write updated manifest to dest path
      manifest.background.scripts = [task.data.background || 'background.js'];
      grunt.file.write(path.join(options.dest, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
  };

  grunt.registerMultiTask('chromeManifest', '', function () {
    targets[this.target](this);
  });

};
