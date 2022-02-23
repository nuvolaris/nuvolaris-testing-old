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
# nuvolaris-testing

This repo includes our test suite and the scripts to build our test environments.

You can discuss it in the #[nuvolaris-testing](https://discord.gg/sgXqn9we) discord channel and in the forum under the category [testing](https://github.com/nuvolaris/nuvolaris/discussions/categories/testing).


Check [this developer guide](DEVEL.md) for informations how to improve it.


# How to build a test cluster in a physical server running Kubernetes

Steps to follow, see below for an example:

Get a remote server running Ubuntu 20.04, say `test.server` You need at least 64gb of memory and 8 cores. 

1. Change to `ansible` and generate a ssh keypair in `inventory/id_rsa`  
2. Copy the public and private key to access the server without password
3. Generate a configuration running ./config.py, see below for the parameters
4. run `./play.sh <cluster>`
5. access to the server with Kubernetes in it with `kubectl --kubeconfig kubeconfig`


## Advanced use

Note that full syntax is  `./play.sh <cluster> [<tag> [<script>]]`

So you can select a tag and execute only a part of the script select by `<tag>` (not documented here).

Also you can use alternative scripts.

## Configuration examples

# KVM with Microk8s

Syntax 

`./config.py kwm <name> <kube-type> <server-hostname> <priv_key-file> <pub_key-file> <node-count> <disk-size-in-gb> <mem-size-in-gb> <num-of-vcpu>`

`<kube-type>` can be `microk8s` or `okd`

Example:

```
# 1 generate keys
cd ansible
ssh-keygen -f inventory/id_rsa
# 2 copy to the test server (change test.server with your own)
ssh-copy-id -i inventory/id_rsa root@test.server
# 3 generate a config names m8s with 4 nodes 20gb disk 8gb memory and 2 vcpu each
./config.py m8s kvm microk8s magrathea.academy inventory/id_rsa inventory/id_rsa.pub 4 20 8 1
# 4 install everything
./play.sh m8s
# 5 check everything works
kubectl --kubeconfig kubeconfig/m8s/kubeconfig get nodes
```

TODO: add other kinds of kubernetes: k3s, kubeadm etc

# AWS

```
./config.py eks aws <key> <secret>  <region> <vm-type> <node-count> <disk-size>
```

Example:

```
/config.py eks aws AAAAAAAAAAAA abcdefghilmnopqrstuwwxyz
#./play.sh eks
```

# Azure

**Pre-requisites**

Create a service pricipal as explained [here](https://docs.microsoft.com/en-us/azure/developer/ansible/create-ansible-service-principal?tabs=azure-cli).
Take note of the *password* field in the output.

Get your *subscription_id*, *tenant* and *client_id* running these commands:

```
az account show --query '{tenantId:tenantId,subscriptionid:id}'
az ad sp list --display-name ansible --query '{clientId:[0].appId}'
```
Create the cluster configuration and run the installation playbook, example:

```
./config.py aks azure <subscription> <tenant> <client id> <secret> northeurope DS2v2 2 50
./play.sh aks
```

**NOTE** The cluster name must contain letters, numbers and hyphens only.

Now you can control your cluster using:

```
./kc.sh aks <kubectl sub command>
```
Example:

```
./kc.sh aks get nodes
```


# How to destroy the cluster

Select the corresponding cleaninig script with the cluster configuration and select the tag clean.

- KVM: `./play.sh clean`
- AWS: `./play.sh clean`
