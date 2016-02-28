'use strict';

const Entities = require('html-entities').AllHtmlEntities;
const Esprima = require('esprima');
const Fs = require('fs');
const Jsdom = require("jsdom");
const Mammoth = require('mammoth');
const Path = require('path');

const entities = new Entities();

const path = Path.join(__dirname, 'sample.docx');

var options = {
    styleMap: [
        "p[style-name='.CodeA'] => div.code > p:fresh",
        "p[style-name='.CodeB'] => div.code > p:fresh"
    ],
    ignoreEmptyParagraphs: false
};

const replacements = [
    { pattern: '...', replace: '' },
    { pattern: '<strong>', replace: '' },
    { pattern: '</strong>', replace: '' },
    { pattern: /\/\/.*/g, replace: ''}
];

const codeListings = [];

const finished = function () {

    codeListings.forEach((l, i) => {

        // 1. Try to parse it as valid JS

        try {
            Esprima.parse(l);
            console.log('Listing %s was valid JS', i + 1);
        } catch (e) {
            console.log('Listing %s was\'t valid JS', i + 1);
        }
    });
};

Mammoth.convertToHtml({ path }, options)
    .then((result) => {

        const html = result.value;
        Jsdom.env(html, (err, window) => {

            if (err) {
                throw err;
            }
            const listings = window.document.querySelectorAll('.code');

            for (var i = 0; i < listings.length; i++) {

                const block = listings[i];
                const lines = [];
                for (var j = 0; j < block.children.length; j++) {
                    let line = entities.decode(block.children[j].innerHTML);
                    replacements.forEach((r) => {
                        line = line.replace(r.pattern, r.replace);
                    });
                    lines.push(line);
                }

                codeListings.push(lines.join('\n'));
            }

            finished();
        });
    })
    .done();
