/*
 * grunt-context > grunt-config
 * https://github.com/indieisaconcept/grunt-context
 *
 * Copyright (c) 2012 "indieisaconcept" Jonathan Barnett
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {

    var npm = require('npm'),
        request = require('request'),
        CliTable = require('cli-table'),

        // grunt shortcuts
        utils = typeof grunt.utils !== 'undefined' ? grunt.utils : grunt.util,
        _ = utils._,
        plugin;

    // ==========================================================================
    // UTILS
    // ==========================================================================

    utils = {

        // ### npm:
        // Wrapper for npm, and used to intall or uninstall grunt plugins
        //
        //      npm(['grunt-requirejs', 'grunt-context'], function () {}, 'install')
        //
        // Since this is asyn the task async callback is passed to ensure the task can
        // be completed correctly.
        //
        // Upon completion a summary table is show
        //
        npm: function (/* Array */ keywords, /* Function? */ done, /* String? */ mode) {

            var total = keywords && keywords.length,
                runningTotal = 0,
                summary = [];

            if (!total) {
                grunt.log.write(grunt.utils.linefeed);
                grunt.log.error('No keyword(s) passed');
                done();
            }

            grunt.log.write(grunt.utils.linefeed);
            grunt.log.writeln('>> Running ' + mode + ' for "' + keywords.join('", "') + '"');

            npm.load(function () {

                if (_.isFunction(done)) {

                    // ensure the task completion
                    // is called once all npm tasks
                    // are complete
                    (function checkCompletion() {

                        if (runningTotal === total) {

                            // display a summary for the current mode
                            utils.table({
                                name: mode.toUpperCase() + ' SUMMARY',
                                options: {
                                    head: ['Name', 'Status'],
                                    style : {
                                        'padding-left' : 1,
                                        head: ['cyan']
                                    }
                                }
                            }, summary);

                            done();

                        } else {
                            setTimeout(checkCompletion, 1000);
                        }

                    }());

                }

                if (keywords[0]) {
                    grunt.log.subhead('>> INSTALLING ' + keywords[0]);
                    grunt.log.write(grunt.utils.linefeed);
                }

                // process each keyword individually for
                // more granular control
                keywords.forEach(function (plugin, index) {

                    npm[mode](plugin, function (error, pkg) {

                        grunt.log.write(grunt.utils.linefeed);

                        // [JB] Revist - can do this neater

                        if (error) {
                            grunt.log.error('Cannot ' + mode + ' "' + plugin + '" try "npm ' + mode + ' ' + plugin + '" instead');
                            summary.push([plugin, 'ERROR']);
                        } else {
                            grunt.log.ok('Succesful ' + mode + ' for "' + plugin + '"');
                            summary.push([plugin, 'SUCCESS']);
                        }

                        if (keywords[index + 1]) {
                            grunt.log.subhead('>> ' + mode.toUpperCase() + ' ' + keywords[index + 1]);
                            grunt.log.write(grunt.utils.linefeed);
                        }

                        runningTotal += 1;

                    });

                });

            });

        },

        // ### filter:
        // Return an array containing rows which match the passed in keywords
        //
        //      filter({
        //          rows: [...]
        //      }, ['keyword', 'keyword'])
        //

        filter: function (/* Object */ data, /* String */ keywords) {

            var matches = _.filter(data.rows, function (row) {

                var values = row.value,
                    evidence = [values.name, values.description, values.readme].join(' '),
                    result = [];

                keywords.forEach(function (keyword) {

                    var reg = new RegExp(keyword, 'gi'),
                        matched = evidence.match(reg);

                    if (matched) {
                        result = result.concat(matched);
                    }

                });

                return !_.isEmpty(result) ? true : false;

            });

            return matches;

        },

        // ### process:
        // Process the data set and pass the current commands options
        //
        //      process({
        //          rows: [...]
        //      }, {
        //          table: {
        //
        //          }
        //      }, ['keyword1', 'keyword2']);
        //
    
        // [JB] Good candidate for a refactor and consolidation.
        process: function (/* Object */ data, /* Object */ options, /* Array */ keywords) {

            data = data.rows || data;

            if (!_.isEmpty(data)) {

                var tables = options.table,
                    render = utils.table;

                tables = _.isFunction(tables) ? tables() : tables;

                // ensure we always process an array
                tables = tables && !_.isArray(tables) ? [tables] : null;

                if (tables) {

                    tables.forEach(function (table) {
                        render(table, data);
                    });

                }

            } else {
              grunt.log.writeln(grunt.utils.linefeed + 'No plugins found matching keyword(s) "' + keywords.join('", "') + '"');
            }

        },

        // ### table:
        // Output a table to the console
        //
        //      table({
        //          name: 'some name',
        //          options: {
        //              head: ['Name', 'Status'],
        //              style : {
        //                  'padding-left' : 1,
        //                   head: ['cyan']
        //              }
        //          }
        //      });
        //

        table: function (/* Object */ table, /* Array? */ data) {

            var results = new CliTable(table.options || {}),
                process = table.process;

            data = _.isFunction(process) && process(data) || data;

            results.push.apply(results, data);

            // render
            if (table.name) {
                grunt.log.subhead(' ' + table.name);
            } else {
                grunt.log.writeln(grunt.utils.linefeed);
            }

            grunt.log.writeln(results.toString());

        },

        // ### serialize:
        // Convert an object to parameters for appending to the end of a url
        //
        //      serialize({
        //          param1: 'somevalue',
        //          param2: 'someothervalue'
        //      });
        //
        //      returns: param1=%22somevalue%22&param2=%22someothervalue%22

        serialize: function (/* Object */ data) {

            var result = _.map(data, function (value, key) {
                return key + '=%22' + value + '%22';
            }).join('&');

            return result;

        }

    };

    // ==========================================================================
    // PLUGIN
    // ==========================================================================

    plugin = {

        name: 'plugin',

        description: 'Search for and install grunt plugins',

        // plugin:<command>
        command: {

            // ### search
            // Search the npm registry for plugins which are flagged as a grunt
            // plugin.

            // [JB] Revisit this - cache the returned results and use this for
            //      subsequent interactions

            search: {

                execute: function (/* String */ keywords, /* Function? */ done) {

                    var helper = utils,

                        // define request settings.
                        // Fetch all plugins tagged as a grunt plugin
                        settings = {
                            url: 'http://search.npmjs.org/_list/search/search?' + helper.serialize({
                                startkey: 'gruntplugin',
                                endkey: 'gruntplugin'
                            }),
                            json: true
                        },

                        options = plugin.command.search.options;

                    // fetch result from the npm repository
                    request.get(settings, function (error, response, body) {

                        if (!error && response.statusCode === 200) {

                            // if a keyword has been passed then allow the returned
                            // data to be filtered
                            body = keywords && helper.filter(body, keywords) || body;
                            helper.process(body, options, keywords);

                        }

                        done();

                    });

                },

                // options:
                // template templates for use for when outputting to the console
                options: {

                    table: {

                        name: 'Search Results',

                        options: {
                            head: ['Name', 'Version', 'Description', 'Author', 'Homepage'],
                            colWidths: [25, 11, 60, 40, 60],
                            style : {
                                'padding-left' : 1,
                                head: ['cyan']
                            }
                        },

                        // [JB] Look at a refactor for this, possibly passing
                        //      the required keys needed instead
                        process: function (/* Object */ data) {

                            var results = [];

                            data.forEach(function (row, index) {

                                var val = row.value,
                                    ver = val['dist-tags'].latest,
                                    source = val.versions[ver] &&
                                             val.versions[ver].homepage || 'N/A';

                                    results.push([row.key, ver, val.description, val.author.name, source]);

                            });

                            return results;

                        }

                    }

                }

            },

            // install:
            // Generic wrapper for the npm helper
            //
            //      install(['keyword', 'keyword'], function () {});
            //

            install: function (/* Array */ keywords, /* Function? */ done) {

                var args = _.toArray(arguments),
                    mode = 'install';

                args.push(mode);
                utils.npm.apply(null, args);

            },

            // uninstall:
            // Generic wrapper for the npm helper
            //
            //      install(['keyword', 'keyword'], function () {});
            //

            uninstall: function (/* Array */ keywords, /* Function? */ done) {

                var args = _.toArray(arguments),
                    mode = 'uninstall';

                args.push(mode);
                utils.npm.apply(null, args);

            }

        },

        // plugin:<command>:<keyword>
        task: function (/* String */ method, /* String */ keyword) {

            var command = method && plugin.command[method],
                name = this.name,
                done;

            // determine default method to use for the task, default is a
            // search if no template is passed, first argument is assumed to be
            // a keyword
            
            if (!command) {

                grunt.log.write(grunt.utils.linefeed);
                grunt.log.writeln('Usage: ' + name + ':<command>:<keyword>');
                grunt.log.write(grunt.utils.linefeed);
                grunt.log.writeln('where <command> is one of: search, install, uninstall');
                grunt.log.write(grunt.utils.linefeed);
                grunt.log.writeln('- ' + name + ':search:<keyword>     Search npm registry for grunt plugins matching keywords');
                grunt.log.writeln('- ' + name + ':install:<keyword>    Install specified plugin(s)');
                grunt.log.writeln('- ' + name + ':uninstall:<keyword>  Removed specified plugin(s)');

            } else {

                done = this.async();

                // extract possible keywords if they exist
                keyword = keyword && keyword.split(',') || keyword;

                // select the appropriate command function to execute
                command = command.execute || command;

                if (_.isFunction(command)) {
                    // execute the current method
                    command(keyword, done);
                }

            }

        },

        helper: function () {
            return 'plugin!!!';
        }

    };

    // ==========================================================================
    // REGISTER TASK
    // ==========================================================================

    plugin.name.split(/[,\s]+/).forEach(function (name) {

        // task
        grunt.registerTask(name, plugin.description, plugin.task);
        // helper
        grunt.registerHelper(name, plugin.helper);

    });

};