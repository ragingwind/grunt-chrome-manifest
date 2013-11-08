'use strict';

// packaged app
//      http://developer.chrome.com/apps/app_lifecycle.html#top
// hosted app
//      https://developers.google.com/chrome/apps/docs/developers_guide?csw=1
// extension
//      http://developer.chrome.com/extensions/background_pages.html
//      http://developer.chrome.com/extensions/event_pages.html

var path = require('path');

module.exports = function (grunt) {

  var _ = grunt.util._;

  grunt.registerMultiTask('chromeManifest', '', function () {
    var options = this.options({
      buildnumber: 'overwrite',
      background: null,
      uglify: 'uglify',
      cssmin: 'cssmin',
      indentSize: 4
    });

    this.files.forEach(function (file) {
      var src = file.src[0];
      var dest = file.dest;
      var concat = grunt.config('concat') || {};
      var uglify = grunt.config(options.uglify) || {};
      var cssmin = grunt.config(options.cssmin) || {};
      var manifest = grunt.file.readJSON(path.join(src, 'manifest.json'));
      var buildnumber = manifest.version.split('.');
      var background;

      // Detect type of background fiel
      if (manifest.app && manifest.app.background) {
        background = manifest.app.background;
      } else if (manifest.background && manifest.background.scripts) {
        background = manifest.background;
      }

      if (background) {
        var target = path.join(dest, options.background.target);
        var exclude = options.background.exclude;

        // update concat config for scripts in background field.
        concat.background = {
          src: [],
          dest: target
        };

        _.each(background.scripts, function (script) {
          if (_.indexOf(exclude, script) === -1) {
            concat.background.src.push(path.join(src, script));
          }
        });

        // Add concated background js to uglify task
        uglify[target] = target;

        // Change background script in manifest to target script path
        background.scripts = [options.background.target];
      }

      // Add contents scripts and css to uglify and cssmin task
      // Will not add script to uglify task.
      // Keep each content scripts to use from different match patterns.
      _.each(manifest.content_scripts, function (contentScript) {
        _.each(contentScript.js, function (js) {
          uglify[path.join(dest, js)] = path.join(src, js);
        });

        _.each(contentScript.css, function (css) {
          cssmin[path.join(dest, css)] = path.join(src, css);
        });
      });

      // Update each grunt configs.
      grunt.config('concat', concat);
      grunt.config(options.cssmin, cssmin);
      grunt.config(options.uglify, uglify);

      // Increase build number that from origin manifest
      if (options.buildnumber === 'overwrite' || options.buildnumber === 'update') {
        var versionUp = function (numbers, index) {
          if (!numbers[index]) {
            grunt.fail.fatal('Build number has overflowing ' + numbers);
            throw 'Build number overflow ' + numbers;
          }
          if (numbers[index] + 1 <= 65535) {
            numbers[index]++;
            return numbers.join('.');
          } else {
            versionUp(numbers, ++index);
          }
        };

        manifest.version = versionUp(buildnumber, buildnumber.length - 1);

        grunt.log.writeln('Build number has changed to ' + grunt.log.wordlist(buildnumber));

        if (options.buildnumber === 'overwrite') {
            grunt.file.write(path.join(src, 'manifest.json'),
                JSON.stringify(manifest, null, options.indentSize));
        }
      }

      // Write updated manifest to destination.
      grunt.file.write(path.join(dest, 'manifest.json'),
            JSON.stringify(manifest, null, options.indentSize));
    });
  });
};
