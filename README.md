# grunt-chrome-manifest

> get scripts/css file list from manifest to handle, and initialize the grunt configuration appropriately, and automatically. then replaces references to non-optimized scripts into background scripts. and auto increment build version in manifest.json.

Watch out, this task is designed for Grunt 0.4 and upwards.

## Getting Started
If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide, as it explains how to create a [gruntfile][Getting Started] as well as install and use grunt plugins. Once you're familiar with that process, install this plugin with this command:

```shell
npm install grunt-chrome-manifest --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-chrome-manifest');
grunt.registerTask('default', ['chrome', 'concurrent:target2']);
```


[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/blob/devel/docs/getting_started.md

## Documentation

### Example usage
```javascript
chromeManifest: {
  options: {
    src: '<%= srcDir %>',
    dest: '<%= destDir %>',
  },
  buildnumber: {
    update: true
  },
  usemin: {
    background: 'scripts/background.js'
  }
};
```

### Config
#### options
##### src
**Required**
Type: 'String'

Path of src directory

##### dest
**Required**
Type: 'String'

Path of dest directory

#### buildnumber
##### update
**Required**
Type: 'Boolean'

Flag of auto-increment build number.

#### usemin
##### background
**Required**
Type: 'String'
Sub path of background script

## Tests

Grunt currently doesn't have a way to test tasks directly. You can test this task by running `grunt` and manually verify that it works.

## License

[BSD license](http://opensource.org/licenses/bsd-license.php) and copyright Google
