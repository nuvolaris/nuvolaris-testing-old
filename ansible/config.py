#!/usr/bin/env python

subnet = "10.0.0"
subnet_mac = "52:54:10:00:00"
virt_dir = "/var/lib/libvirt"

# ubuntu 16.04
#image_url = "https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-disk1.img"

# ubuntu
image_url = "https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64-disk-kvm.img"

# cloud-init to build which kind of cluster
cluster_type = "microk8s"

# plain cluster - just set the sshkey...
# cluster_type = "plain"

import sys
import socket
import argparse
import os.path
import base64

def header():
  with open("inventory/id_rsa.pub", "r") as f:
    ssh_authorized_key = f.read()
  return f"""[all:vars]
virt_dir={virt_dir}
image_url={image_url}
cluster_type={cluster_type}
ssh_authorized_key={ssh_authorized_key}
"""

def inventory(cluster, server, count, disk, mem, cpu):
  hosts = "[server]\n"
  hosts += f"{server} cluster={cluster} subnet={subnet} subnet_mac={subnet_mac} nodes_count={count}\n"
  hosts += "[nodes]\n"
  for n in range(count):
    vcpu = 2 if n == 0 and cpu == 1 else cpu
    hosts += f"{subnet}.{10+n} id={n} hostname={cluster}{n} mac_addr={subnet_mac}:{10+n} disk_size={disk} mem_size={mem} vcpu_num={vcpu}\n"
  return hosts

def write_file(filename, content):
  print(f">>> {filename}")
  dir = os.path.dirname(filename)
  try:
    os.makedirs(dir, 0o755)
  except OSError:
    pass
  with open(filename, "w") as f:
    f.write(content)

if __name__ == "__main__":
  parser = argparse.ArgumentParser("configure")
  parser.add_argument("cluster", help="name of cluster")
  parser.add_argument("server", help="hostname of server")
  parser.add_argument("count", type=int, help="number of nodes")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  parser.add_argument("mem", type=int, help="memory size in gigabytes of each node")
  parser.add_argument("cpu", type=int, help="number of virtual cpu per node of each node")

  args = parser.parse_args()
  write_file(f"inventory/{args.cluster}/hosts", 
    header() + inventory(args.cluster, args.server, args.count, args.disk, args.mem, args.cpu))
