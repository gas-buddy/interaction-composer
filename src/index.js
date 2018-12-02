import fs from 'fs';
import path from 'path';
import confit from 'confit';
import minimist from 'minimist';
import yaml from 'js-yaml';
import buildAlexa from './alexa';

const argv = minimist(process.argv.slice(2));

async function loadFileDependency(p) {
  return (new Promise((accept, reject) => {
    fs.readFile(p, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      let objValue;
      const ext = (path.extname(p) || '').toLowerCase();
      if (['.yml', '.yaml'].includes(ext)) {
        try {
          objValue = yaml.safeLoad(data.toString());
        } catch (parseError) {
          reject(parseError);
          return;
        }
      } else {
        try {
          objValue = JSON.parse(data.toString());
        } catch (jsonError) {
          reject(jsonError);
          return;
        }
      }
      accept(objValue);
    });
  }));
}

const basedir = path.resolve(argv._[0]);
if (!argv.quiet) {
  console.log('Building model from', basedir);
}

const protocols = {
  async require(value, callback) {
    const v = await loadFileDependency(path.resolve(basedir, value));
    callback(null, v);
  },
};

confit({ basedir, protocols }).create(async (err, config) => {
  if (err) {
    console.error('Failed to generate model', err);
    process.exit(-1);
  }
  // If we're going to export to multiple formats, switch here.
  let outputModel;
  switch (argv.format) {
    default:
      outputModel = await buildAlexa(config);
  }
  console.log(JSON.stringify(outputModel, null, '\t'));
});
