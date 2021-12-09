#!/bin/bash
virsh list --all
virsh shutdown --domain $1
virsh destroy --domain $1
virsh undefine --domain $1 --remove-all-storage
virsh list --all
