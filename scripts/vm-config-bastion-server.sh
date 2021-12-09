#!/bin/bash
virt-builder centos-8.2 -x -v -x --format qcow2 \
  --size 20G -o /var/lib/libvirt/images/ocp-bastion-server.qcow2 \
  --root-password password:StrongRootPassw0rd
