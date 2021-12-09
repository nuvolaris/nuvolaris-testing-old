#!/bin/bash
rm okd4-network.xml
vm-generate-okd4-network.sh
virsh net-define --file okd4-network.xml
virsh net-autostart okd4
virsh net-start okd4
brctl show
