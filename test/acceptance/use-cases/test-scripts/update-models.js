'use strict';
const app = require('../../../../');
const expect = require('../../../helpers/expect');
const fs = require('fs-extra');
const loopback = require('loopback');
const ModelClass = require('../../../../component/datamodel/model');
const path = require('path');
const testSupport = require('../../../helpers/test-support');
const util = require('util');
const workspaceManager = require('../../../../component/workspace-manager');
const TYPE_OF_TEST = 'acceptance';

const ModelDefinition = app.models.ModelDefinition;
const ModelConfig = app.models.ModelConfig;

app.on('booted', function() {
  app.emit('ready');
});

module.exports = function() {
  const testsuite = this;

  this.When(/^I change property '(.+)' to '(.+)'$/,
  function(fieldName, value, next) {
    testsuite.modelId = 'common.models.' + testsuite.modelName;
    const model = {};
    model[fieldName] = value;
    testsuite.expectedFields = {};
    const options = {workspaceId: testsuite.workspaceId};
    ModelDefinition.updateAttributes(testsuite.modelId, model, options,
    function(err) {
      if (err) return next(err);
      testsuite.expectedFields[fieldName] = value;
      next();
    });
  });

  this.Then(/^The model definition json is updated$/, function(next) {
    const storedModel = testsuite.workspace.getModel(testsuite.modelId);
    const file = storedModel.getFilePath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      Object.keys(testsuite.expectedFields).forEach(function(key) {
        expect(data[key]).to.eql(testsuite.expectedFields[key]);
      });
      next();
    });
  });

  this.When(new RegExp(['^I change \'(.+)\' ',
    'facet Model Config property \'(.+)\' to \'(.+)\' ',
    'in workspace \'(.+)\'$'].join('')),
  function(facetName, fieldName, value, workspaceName, next) {
    const model = {
      facetName: facetName,
    };
    model[fieldName] = value;
    testsuite.ModelConfig = {};
    testsuite.ModelConfig.facetName = facetName;
    testsuite.ModelConfig.expectedFields = {};
    const options = {workspaceId: testsuite.workspaceId};
    ModelConfig.updateAttributes(testsuite.modelId, model, options,
    function(err) {
      if (err) return next(err);
      testsuite.ModelConfig.expectedFields[fieldName] = value;
      next();
    });
  });

  this.Then(/^The model config json is updated$/, function(next) {
    const facet = testsuite.workspace.getFacet(testsuite.ModelConfig.facetName);
    const file = facet.getModelConfigPath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      const config = data[testsuite.modelName];
      expect(config).to.not.to.be.undefined();
      Object.keys(testsuite.ModelConfig.expectedFields).forEach(function(key) {
        expect(testsuite.ModelConfig.expectedFields[key]).to.eql(config[key]);
      });
      next();
    });
  });
};