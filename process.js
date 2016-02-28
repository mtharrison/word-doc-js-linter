'use strict';

const _ = require('lodash');
const Entities = require('html-entities').AllHtmlEntities;
const Esprima = require('esprima');
const Jsdom = require("jsdom");
const Linter = require("eslint").linter;
const Config = require('eslint/lib/config');
const Mammoth = require('mammoth');

var configHelper = new Config({
    cwd: __dirname
});

const getListingsFromFile = function (path, options) {

    const codeListings = [];
    const entities = new Entities();

    return new Promise((resolve, reject) => {

        Mammoth.convertToHtml({ path }, options.mammoth).then((result) => {

            const html = result.value;
            Jsdom.env(html, (err, window) => {

                if (err) {
                    return reject(err);
                }

                const listings = window.document.querySelectorAll('.code');

                for (var i = 0; i < listings.length; i++) {

                    const block = listings[i];
                    const lines = [];
                    for (var j = 0; j < block.children.length; j++) {
                        let line = entities.decode(block.children[j].innerHTML);
                        options.replacements.forEach((r) => {
                            line = line.replace(r.pattern, r.replace);
                        });
                        lines.push(line);
                    }

                    codeListings.push({ listing: lines.join('\n') });
                }

                resolve({ codeListings, options });
            });
        });
    });
};

const verifyJs = function (val) {

    const options = val.options;
    const listings = val.codeListings;

    return new Promise((resolve, reject) => {

        listings.forEach((l) => {
            try {
                Esprima.parse(l.listing);
                l.valid = true;
            } catch (e) {
                l.valid = false;
            }
        });

        resolve({ listings, options });
    });
};

const lint = function (val) {

    const options = val.options;
    const listings = val.listings;

    const config = configHelper.getConfig();
    config.rules = _.omit(config.rules, options.omitRules);

    return new Promise((resolve, reject) => {

        for (let i = 0; i < listings.length; i++) {
            if (listings[i].valid) {
                try {
                    listings[i].lintMessages = Linter.verify(listings[i].listing, config);
                } catch (e) {
                    console.log('err', e);
                    return reject(e);
                }
            }
        }

        resolve(listings, options);
    });
};

exports.process = function (path, options, callback) {

    getListingsFromFile(path, options)
    .then(verifyJs)
    .then(lint)
    .then((listings) => {

        callback(null, listings);
    })
    .catch((err) => {

        callback(err);
    });
};
