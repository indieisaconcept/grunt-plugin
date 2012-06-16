# grunt-plugin

The aim of this plugin is to illustrate how the discovery of plugins for new and existing users of grunt could be done by providing a way to search for, install and remove plugins directly from grunt.

I got the idea for this plugin after reading the comments below and also after using @cowboy's [jsfiddle](http://jsfiddle.net/cowboy/qzRjD/show/ "Grunt plugins published to Npm") for "Grunt plugins published to Npm".

- https://github.com/cowboy/grunt/issues/228#issuecomment-6354257
- https://github.com/cowboy/grunt/issues/228#issuecomment-6354982
- https://github.com/cowboy/grunt/issues/228#issuecomment-6355281

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: 

`npm install "git://github.com/indieisaconcept/grunt-package#master"`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-plugin');
```

[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation

### Usage

grunt-plugin supports arguments. The arguments are broken down as follows:

plugin: *command* : *keyword*

+ **command**: The plugin command to use
+ **keyword**: Plugin keywords to use

If no arguments are passed, a listing of supported commads will be outputted to the console

```javascript

> grunt plugin

Usage: plugin:<command>:<keyword>

where <command> is one of: search, install, uninstall

- plugin:search:<keyword>     Search npm registry for grunt plugins matching keywords
- plugin:install:<keyword>    Install specified plugin(s)
- plugin:uninstall:<keyword>  Removed specified plugin(s)

```

#### Commands

##### Search

This command will search the NPM registry and return a listing of plugins which currently have the keyword "gruntplugin". The returned results are then filtered based on the keywords passed. If ommited all plugins will be display.

```javascript
> grunt plugin:search:css,haml
```

!['Example console output'](https://github.com/indieisaconcept/grunt-package/raw/master/screenshot.png)

##### Install and Uninstall

These commands are just wrappers around npm to provide support to install and removed plugins.

**Install**

```javascript
> grunt plugin:install:grunt-requirejs,grunt-haml
```

**Uninstall**

```javascript
> grunt plugin:uninstall:grunt-requirejs,grunt-haml
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History

### 0.1.0
+ Initial Release

## License
Copyright (c) 2012 Jonathan Barnett  
Licensed under the MIT license.
