#!/bin/bash
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
cd "$(dirname $0)"

INV=${1:?cluster}
TAG=${2:-all}

shift
shift

die() {
    echo "$@"
    exit 1
}

test -f inventory/id_rsa || die "please put the private key for the main server in inventory/id_rsa"
test -f inventory/id_rsa.pub || die "please put the public for the main server inventory/id_rsa.pub"
test -f "inventory/$INV.type" || die "please configure a cluster with config.py"

TYPE="$(cat inventory/$INV.type)"
SCRIPT=${1:-$TYPE}
shift

ansible-playbook \
  -i ./inventory/$INV \
  --tags "$TAG" \
  "$@" \
  "scripts/${SCRIPT##.yml}.yml" 
