#!/bin/bash
virt-install \
  --name ocp-bastion-server \
  --ram 4096 \
  --vcpus 2 \
  --disk path=/var/lib/libvirt/images/ocp-bastion-server.qcow2 \
  --os-type linux \
  --os-variant rhel8.0 \
  --network bridge=okd4 \
  --graphics none \
  --serial pty \
  --console pty \
  --boot hd \
  --import
