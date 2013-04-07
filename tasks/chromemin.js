'use strict';

var util = require('util');
var path = require('path');

var inspect = function (obj) {
  return util.inspect(obj, false, 4, true);
};


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

    dist: function (task) {
      var options = task.options();
      var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));
      var background = path.join(options.dest, options.background || 'background.js');

      // update background scripts file list.
      manifest.background.scripts = [background];
      if (grunt.option('buildnumber')) {
        manifest.version = grunt.option('buildnumber');
      }

      grunt.file.write(path.join(options.dest, 'manifest.json'), JSON.stringify(manifest, null, 2));

      if (task.data.compress) {
        var compress = grunt.config('compress') || {};
        compress.dist = {
          options: {
            archive: task.data.compress
          },
          files: [{
            expand: true,
            cwd: options.dest,
            src: ['**'],
            dest: ''
          }]
        };
        grunt.config('compress', compress);
      }
    },

    prepare: function (task) {
      var options = task.options();
      var configs = targets.configs(options);
      var manifest = grunt.file.readJSON(path.join(options.src, 'manifest.json'));
      var background = path.join(options.dest, options.background || 'background.js');

      // update concat config for scripts in background field.
      configs.concat.background = {
        src: background,
        dest: manifest.background.scripts
      };

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

      // update version in manifest.
      // refer to http://developer.chrome.com/extensions/manifest.html#version
      if (task.data.buildnumber) {
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

        grunt.option('buildnumber', numberup(buildnumber, buildnumber.length - 1));
      }

      // update changed grunt configs.
      configs.update();

      grunt.log.subhead('Chrome Configuration is now:')
               .subhead('  cssmin:')
               .writeln('  ' + inspect(configs.cssmin))
               .subhead('  concat:')
               .writeln('  ' + inspect(configs.concat))
               .subhead('  uglify:')
               .writeln('  ' + inspect(configs.uglify));

    }
  };

  grunt.registerMultiTask('chromemin', '', function () {
    targets[this.target](this);
  });

};
