#!/bin/bash
cd "$(dirname $0)"

INV=${1:?cluster}
shift

die() {
    echo "$@"
    exit 1
}

test -f inventory/id_rsa || die "please put the private key for the main server in inventory/id_rsa"
test -f inventory/id_rsa.pub || die "please put the public for the main server inventory/id_rsa.pub"
test -d "inventory/$INV" || die "please configure a cluster with config.py"

ansible --private-key=inventory/id_rsa -i inventory/$INV  "$@" 
