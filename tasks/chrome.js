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

    // increase build version in manifest.json.
    // refer to http://developer.chrome.com/extensions/manifest.html#version
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

    compress: function (task) {
      var options = task.options();
      var compress = grunt.config('compress') || {};
      compress.dist = {
        options: {
          archive: task.data.archive
        },
        files: [{
          expand: true,
          cwd: options.dest,
          src: ['**'],
          dest: ''
        }]
      };

      grunt.config('compress', compress);
    },

    manifestmin: function (task) {
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
      manifest.background.scripts = [background];
      grunt.file.write(path.join(options.dest, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
  };

  grunt.registerMultiTask('chrome', '', function () {
    targets[this.target](this);
  });

};
