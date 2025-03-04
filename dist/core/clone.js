'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = clone;

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _deepAssign = require('deep-assign');

var _deepAssign2 = _interopRequireDefault(_deepAssign);

var _fs3 = require('../utils/fs.js');

var _fs4 = _interopRequireDefault(_fs3);

var _path = require('../utils/path.js');

var _path2 = _interopRequireDefault(_path);

var _git = require('../utils/git.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.decho = global.decho || console;

function doJob(repoName, repoPath, localBranch, remoteBranch, rBranch, dirname) {

  return new _promise2.default(function (resolve, reject) {

    if (repoName && repoPath) {
      if (_fs2.default.existsSync(repoPath)) {
        return (0, _git.doBranch)(repoPath).then(function (stdout) {
          global.decho.log(_chalk2.default.green('更新 '), '' + repoName);
          // if (rBranch.test(stdout)) {
          //   return doPull(repoName, repoPath).then(function(){
          //     resolve();
          //   });
          // } else {
          //   global.decho.log(chalk.yellow('警告 '), repoName, '不是 ' + localBranch + ' 分支， 跳过更新。');
          //   resolve();
          // }
          return (0, _git.doPull)(repoName, repoPath).then(function () {
            resolve();
          });
        });
      } else {
        global.decho.log(_chalk2.default.green('克隆 '), '' + repoName);
        return (0, _git.doClone)(repoName, repoPath, dirname).then(function () {
          // if (localBranch !== 'master' && localBranch !== 'main') {
          //   global.decho.log(chalk.yellow(`配置的默认分支为 ${localBranch} 非 master 分支，需要检出`));
          //   global.decho.log(chalk.green('检出 '), `${repoName} 分支：${localBranch} ${remoteBranch}`);
          //   return doCheckout(repoName, repoPath, remoteBranch, localBranch).then(function(){
          //     resolve();
          //   });
          // } else {
          //   resolve();
          // }
          (0, _git.doCheckout)(repoName, repoPath, 'origin/master', 'master').then(function () {
            global.decho.log(_chalk2.default.yellow('\u5C1D\u8BD5\u68C0\u51FA master \u5206\u652F\u6210\u529F'));
            resolve();
          }).catch(function (err) {
            global.decho.log(_chalk2.default.yellow('\u68C0\u51FA master \u5206\u652F\u5931\u8D25'));
            (0, _git.doCheckout)(repoName, repoPath, 'origin/main', 'main').then(function () {
              global.decho.log(_chalk2.default.yellow('\u5C1D\u8BD5\u68C0\u51FA main \u5206\u652F\u6210\u529F'));
              resolve();
            }).catch(function (err) {
              global.decho.log(_chalk2.default.yellow('\u68C0\u51FA main \u5206\u652F\u5931\u8D25'));
              resolve();
            });
          });
        });
      }
    } else {
      reject();
    }
  });
}

function clone(dirname, spaceInfo) {
  return new _promise2.default(function (resolve, reject) {
    var _spaceInfo = (0, _deepAssign2.default)({
      "global": {
        "git": {
          "branch": {
            "local": "master",
            "remote": ""
          },
          "hooks": []
        }
      }
    }, spaceInfo);

    var spaceGlobal = spaceInfo.global;
    var repos = spaceInfo.repos;

    if (repos && repos.length > 0) {
      _async2.default.eachSeries(repos, function (pj, callback) {
        if (pj) {
          var repoName = (pj.host || spaceGlobal.host).replace(/\/$/, '') + '\/' + pj.repo.replace(/\.git$/i, '') + ".git";
          var repoPath = _path2.default.join(dirname, pj.mapping || _path2.default.basename(pj.repo.replace(/\.git$/i, '') + '.git', '.git'));
          var localBranch = pj.branch && pj.branch.local ? pj.branch.local : spaceGlobal.branch.local;
          var remoteBranch = pj.branch && pj.branch.remote ? pj.branch.remote : spaceGlobal.branch.remote;
          var rBranch = new RegExp('\\*\\s' + localBranch + '\\b', 'm');

          return doJob(repoName, repoPath, localBranch, remoteBranch, rBranch, dirname).then(function () {
            var gitConfigs = (0, _deepAssign2.default)(spaceGlobal.config, pj.config);
            return (0, _git.doConfigs)(gitConfigs, repoPath);
          }).then(function () {
            callback();
          }).catch(function (err) {
            reject(err);
            callback();
          });
        } else {
          callback();
        }
      }, function () {
        global.decho.log(_chalk2.default.bgGreen.yellow('All Jobs Done...'));
        resolve();
      });
    } else {
      reject();
    }
  });
};