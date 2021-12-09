#!/bin/bash
virt-install --name $1 \
             --ram 4096 \
             --disk path=/var/lib/libvirt/images/ubuntu18.img,size=8 \
             --vcpus 2 \
             --os-type linux \
             --os-variant ubuntu18.04 \
             --network bridge=vmbr0 \
             --graphics none \
             --console pty,target_type=serial \
             --location 'http://mirror-us.archive.ubuntu.com/ubuntu/dists/bionic/main/installer-amd64/' \
             --extra-args 'console=ttyS0,115200n8 serial'
