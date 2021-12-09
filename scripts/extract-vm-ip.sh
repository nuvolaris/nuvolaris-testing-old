#!/bin/bash
./show-vm-ip.sh $1 | awk '{ print $5 }' | tail -n +3 | awk '{split($0,a,"/"); print a[1]}'
