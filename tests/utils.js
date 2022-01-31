/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
// eslint-disable-next-line max-len
const isBase64Pattern = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');

/**
 * Creates a payload for the initialization of a container
 * @param {function} code code to run in a container
 * @param {string} main name of the main function
 * @param {object} env env variables
 * @return {object} payload with code, main function and env vars
 */
function initPayload(code, main = 'main', env = null) {
  let b = false;
  if (code) {
    const t = code.trim();
    b = (t.length > 0) && (t.length % 4 == 0) && isBase64Pattern.test(t);
  }

  return {
    value: {
      code,
      main,
      binary: b,
      env,
    },
  };
}

/**
 * wraps args in {value: args, ...other}
 * @param {{}} args
 * @param {{}} other
 * @return {{args, other}}
 */
function runPayload(args, other) {
  return {value: args, ...other};
}

/**
 * The action proxies insert this line in the logs
 * at the end of each activation for stdout/stderr.
 *
 * Note: Blackbox containers might not add this sentinel,
 * as we cannot be sure the action developer actually does this.
 */
// eslint-disable-next-line no-unused-vars
const ACTIVATION_LOG_SENTINEL = 'XXX_THE_END_OF_A_WHISK_ACTIVATION_XXX';

/**
 * Checks that the output streams (stdout, stderr) contains
 * the expected information
 * @param {string} stdout
 * @param {string} stderr
 * @param {function} additionalCheck
 * @param {number} sentinelCount
 * @param {boolean} concurrent
 * @return {*} if checks fail an error is returned,
 *  otherwise return additionalCheck result
 */
function checkStreams({stdout, stderr, additionalCheck, sentinelCount = 1}) {
  const outSentinelMatches =
    (stdout.match(/XXX_THE_END_OF_A_WHISK_ACTIVATION_XXX/g) || []).length;
  const errSentinelMatches =
    (stderr.match(/XXX_THE_END_OF_A_WHISK_ACTIVATION_XXX/g) || []).length;
  let error = 'expected number of stdout sentinels';

  if (sentinelCount !=outSentinelMatches) {
    return {error};
  }
  error = 'expected number of stderr sentinels';
  if (sentinelCount != errSentinelMatches) {
    return error;
  }

  const o = stdout.replaceAll('XXX_THE_END_OF_A_WHISK_ACTIVATION_XXX', '');
  const e = stderr.replaceAll('XXX_THE_END_OF_A_WHISK_ACTIVATION_XXX', '');
  return additionalCheck(o, e);
}


module.exports = {
  initPayload,
  runPayload,
  checkStreams,
};
