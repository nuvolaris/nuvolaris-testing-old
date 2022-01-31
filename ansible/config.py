#!/usr/bin/env python

subnet = "10.0.0"
subnet_mac = "52:54:10:00:00"
virt_dir = "/var/lib/libvirt"

params = {
  "microk8s": { 
     "image_url": "https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img",
     "os_variant": "ubuntu20.04",
     "base_image": "ubuntu-20.04",
  }, 
  "okd": {
    "image_url": "https://builds.coreos.fedoraproject.org/prod/streams/stable/builds/35.20220103.3.0/x86_64/fedora-coreos-35.20220103.3.0-qemu.x86_64.qcow2.xz",
    "os_variant": "fedora-unknown",
    "base_image": "fedora-coreos35",
  },
  "k3s": {
    "image_url": "https://download.rockylinux.org/pub/rocky/8.5/images/Rocky-8-GenericCloud-8.5-20211114.2.x86_64.qcow2",
    "os_variant": "rhel8-unknown",
    "base_image": "rocky-8.5",
  }
}

import sys
import socket
import argparse
import os.path
import base64
import random
import string

def header(cluster_type):
  # geneate random token to join kubernetes
  kube_token = ''.join(random.choices(string.hexdigits[:16], k=32))
  with open("inventory/id_rsa.pub", "r") as f:
    ssh_authorized_key = f.read()
  return f"""[all:vars]
virt_dir={virt_dir}
image_url={params[cluster_type]['image_url']}
os_variant={params[cluster_type]['os_variant']}
base_image={params[cluster_type]['base_image']}
cluster_type={cluster_type}
ssh_authorized_key={ssh_authorized_key}
kube_master={subnet}.10
kube_token={kube_token}
"""

def inventory(cluster, server, count, disk, mem, cpu):
  hosts = "[server]\n"
  hosts += f"{server} cluster={cluster} subnet={subnet} subnet_mac={subnet_mac} nodes_count={count}\n"
  hosts += "\n[nodes]\n"
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
  parser.add_argument("type", help="cluster type", choices=["okd", "microk8s"])
  parser.add_argument("count", type=int, help="number of nodes")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  parser.add_argument("mem", type=int, help="memory size in gigabytes of each node")
  parser.add_argument("cpu", type=int, help="number of virtual cpu per node of each node")

  args = parser.parse_args()
  write_file(f"inventory/{args.cluster}/hosts", 
    header(args.type) + inventory(args.cluster, args.server, args.count, args.disk, args.mem, args.cpu))
