#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import confit from 'confit';
import minimist from 'minimist';
import yaml from 'js-yaml';
import { debuglog } from 'util';
import buildAlexa from './alexa';
import validateModel from './validate';

require('source-map-support').install();

const logger = debuglog('interaction-composer');

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

function flatten(map) {
  const flat = [];
  Object.values(map || {}).forEach((entry) => {
    if (Array.isArray(entry)) {
      flat.push(...entry);
    } else {
      flat.push(entry);
    }
  });
  return flat;
}

function merge(types) {
  if (Array.isArray(types)) {
    const merged = {};
    types.forEach(m => Object.assign(merged, m));
    return merged;
  }
  return types;
}

const basedir = path.resolve(argv._[0]);
logger('Building model from %s', basedir);

const protocols = {
  async require(value, callback) {
    const v = await loadFileDependency(path.resolve(basedir, value));
    callback(null, v);
  },
};

function bail(error) {
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to generate model:', error);
    logger(error);
    process.exit(-1);
  }
}

if (argv.env) {
  process.env.NODE_ENV = argv.env;
}

confit({ basedir, protocols }).create(async (err, config) => {
  bail(err);

  const intents = flatten(config.get('intents'));
  const slotTypes = merge(config.get('slotTypes'));

  try {
    await validateModel(config, intents, slotTypes);
  } catch (error) {
    bail(error);
  }

  // If we're going to export to multiple formats, switch here.
  let outputModel;
  switch (argv.format) {
    default:
      outputModel = await buildAlexa(config, intents, slotTypes);
  }
  if (argv.output) {
    const outfile = path.resolve(argv.output);
    fs.writeFileSync(outfile, JSON.stringify(outputModel, null, '  '));
    debuglog('Wrote output to %s', argv.output);
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(outputModel, null, '  '));
  }
});
