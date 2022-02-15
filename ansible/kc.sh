#!/bin/sh
CLUSTER=${1:?cluster}
shift
KUBECONFIG=kubeconfig/$CLUSTER/kubeconfig kubectl "$@"
