#!/bin/bash
cd "$(dirname $0)"

INV=${1:?cluster}
SCRIPT=${2:?script}
shift
shift

die() {
    echo "$@"
    exit 1
}

test -f inventory/id_rsa || die "please put the private key for the main server in inventory/id_rsa"
test -f inventory/id_rsa.pub || die "please put the public for the main server inventory/id_rsa.pub"
test -d "inventory/$INV" || die "please configure a cluster with config.py"
test -f "scripts/$SCRIPT.yml" || die "please pick one yml from ./scripts (w/.yml)"

ansible-playbook \
  --private-key=inventory/id_rsa \
  -i inventory/$INV \
  -e @vars.yaml \
  "$@" \
  "scripts/${SCRIPT##.yml}.yml"
