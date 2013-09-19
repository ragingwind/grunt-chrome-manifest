'use strict';

var path = require('path');

module.exports = function (grunt) {

  var _ = grunt.util._;

  grunt.registerMultiTask('chromeManifest', '', function () {
    var options = this.options({
      buildnumber: false,
      background: null,
      uglify: 'uglify',
      cssmin: 'cssmin',
      indentSize: 4
    });

    this.files.forEach(function (file) {
      var src = file.src[0];
      var dest = file.dest;
      var manifest = grunt.file.readJSON(path.join(src, 'manifest.json'));
      var concat = grunt.config('concat') || {};
      var uglify = grunt.config(options.uglify) || {};
      var cssmin = grunt.config(options.cssmin) || {};
      var buildnumber = manifest.version.split('.');

      if (options.background) {
        if (options.background.target) {

          if (manifest.background && manifest.background.page) {
            grunt.fail.warn('incompatible background.target option with manifest.background.page');
          }

          var background = path.join(dest, options.background.target);

          // update concat config for scripts in background field.
          concat.background = {
            src: [],
            dest: background
          };

          var exclude = options.background.exclude;

          if (exclude && manifest.background && manifest.background.scripts) {
            _.each(manifest.background.scripts, function (script) {
              if (_.indexOf(exclude, script) === -1) {
                concat.background.src.push(path.join(src, script));
              }
            });

            // remove file in manifest.json
            _.each(exclude, function (script) {
              manifest.background.scripts = _.without(manifest.background.scripts, script);
            });
          }

          // update uglify config for concated background.js.
          uglify[background] = background;
        
        } // if background.options.target
      } // if background

      if (manifest.content_scripts) {
        // update uglify and css config for content scripts field.
        _.each(manifest.content_scripts, function (contentScript) {
          _.each(contentScript.js, function (js) {
            uglify[path.join(dest, js)] = path.join(src, js);
          });

          _.each(contentScript.css, function (css) {
            cssmin[path.join(dest, css)] = path.join(src, css);
          });
        });
      }

      // update grunt configs.
      grunt.config('concat', concat);
      grunt.config(options.cssmin, cssmin);
      grunt.config(options.uglify, uglify);

      // set updated build number to manifest on dest.
      if (options.buildnumber) {
        var versionUp = function (numbers, index) {
          if (!numbers[index]) {
            throw 'Build number overflow.' + numbers;
          }
          if (numbers[index] + 1 <= 65535) {
            numbers[index]++;
            return numbers.join('.');
          } else {
            versionUp(numbers, ++index);
          }
        };
        manifest.version = versionUp(buildnumber, buildnumber.length - 1);
        grunt.file.write(path.join(src, 'manifest.json'), JSON.stringify(manifest, null, options.indentSize));
      }

      if (options.background && options.background.target) {
        if (!manifest.background) { manifest.background = {}; }

        // set updated background script list to manifest on dest.
        manifest.background.scripts = [options.background.target];
      }

      // write updated manifest to dest path
      grunt.file.write(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, options.indentSize));
    });
  });
};
