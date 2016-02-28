const Fs = require('fs');
const Handlebars = require('Handlebars');
const Items = require('items');
const Path = require('path');
const Process = require('./process');

const options = {
    replacements: [
        { pattern: '...', replace: '' },
        { pattern: '<strong>', replace: '' },
        { pattern: '</strong>', replace: '' },
        { pattern: /\/\/.*/g, replace: ''}
    ],
    mammoth: {
        styleMap: [
            "p[style-name='.CodeA'] => div.code > p:fresh",
            "p[style-name='.CodeB'] => div.code > p:fresh"
        ],
        ignoreEmptyParagraphs: false
    },
    omitRules: ['eol-last', 'no-trailing-spaces', 'strict']
};

const documents = [
    'Harrison_HapiJS_ch01',
    'Harrison_HapiJS_ch02',
    'Harrison_HapiJS_ch03',
    'Harrison_HapiJS_ch04',
    'Harrison_HapiJS_ch05',
    'Harrison_HapiJS_ch06',
    'Harrison_HapiJS_ch07',
    'Harrison_HapiJS_ch08',
    'Harrison_HapiJS_ch09',
    'Harrison_HapiJS_ch11'
];

const hbs = Fs.readFileSync(Path.join(__dirname, 'template.hbs'));
const template = Handlebars.compile(hbs.toString());

const process = function (item, next) {

    Process.process(Path.join(__dirname, 'input', item + '.docx'), options, (err, res) => {

        if (err) {
            return next(err);
        }

        Fs.writeFileSync(Path.join(__dirname, 'output', item + '.html'), template({
            document: item,
            listings: res
        }));
        console.log('Finished writing %s', item);
        return next(null);
    });
};

Items.parallel(documents, process, (err) => {

    if (err) {
        throw err;
    }
});
