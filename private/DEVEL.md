<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
  ~
-->
# Developer Guide

This is an ansible script to be executed from the developer container or from a github actions.

For development, please execute it from a terminal opening the Nuvolaris development container with VSCode (check [this](https://github.com/nuvolaris/nuvolaris/blob/main/docs/DEVEL.md)), so you pick he right version of ansible


If you need more libraries for ansible galaxy, please add them to the setup task of the [Taskfile](./Taskfile.yml).

Execute the scripts with cd in the `ansible` folder, and please follow the stucture. It separates the inventory in multiple folders under `inventory` and the starting point in multiple under the `scripts` folder, so you can build either a server or a cloud with it.

The script is expected to be configured with:

```
./config.py <name> <cluster> <params...>
```

So edit the `config.py` to generate the inventory for `<name>` under a subfolder of `inventory`

The script is expected to be executed with `play.sh <name>`

At the end the script is expected to leave a kubeconfig to access the cluster under `kubeconfig/<name>/kubeconfig`.

So please implement your deployment as one or more roles under `roles` and create a starting point under `<scripts>` named `<cluster>.yml` that will invoke your role.


