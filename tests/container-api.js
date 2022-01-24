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
const axios = require('axios');

/**
 * For testing convenience, this interface abstracts away the REST calls to a
 * container as blocking method calls of this interface.
 */
class ContainerApi {
  /**
   * non glie piace
   * @param {function} init function to initialize container
   * @param {function} run function to execute wsk function in container
   */
  constructor(init, run) {
    this.init = init;
    this.run = run;
    // this.runMultiple = runMultiple; TODO run multiple
  }
}

// Create an instance of the mock container interface for testing
const mockContainerApi = (ip, port) => new ContainerApi(
    (value) => syncPost(ip, port, '/init', value),
    (value) => syncPost(ip, port, '/run', value),
    // (values) => concurrentSyncPost(ip, port, "/run", values) TODO
);

const syncPost = (host, port, endPoint, content) =>
  axios({
    method: 'POST',
    url: `http://${host}:${port}${endPoint}`,
    data: content,
    validateStatus: () => true,
  });

module.exports = {
  mockContainerApi,
};
