#!/usr/bin/env python
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

vpc = "10.0"
subnet = "10.0.0"
subnet_mac = "52:54:10:00:00"
virt_dir = "/var/lib/libvirt"

params = {
  "microk8s": { 
     "image_url": "https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img",
     "os_variant": "ubuntu20.04",
     "base_image": "ubuntu-20.04",
     "kube_port": "16443",
  }, 
  "okd": {
    "image_url": "https://builds.coreos.fedoraproject.org/prod/streams/stable/builds/35.20220103.3.0/x86_64/fedora-coreos-35.20220103.3.0-qemu.x86_64.qcow2.xz",
    "os_variant": "fedora-unknown",
    "base_image": "fedora-coreos35",
     "kube_port": "6443",
  },
  "k3s": {
    "image_url": "https://download.rockylinux.org/pub/rocky/8.5/images/Rocky-8-GenericCloud-8.5-20211114.2.x86_64.qcow2",
    "os_variant": "rhel8-unknown",
    "base_image": "rocky-8.5",
    "kube_port": "6443",
  }
}

import sys
import socket
import argparse
import os.path
import base64
import random
import string

def write_file(filename, content):
  print(f">>> {filename}")
  dir = os.path.dirname(filename)
  try:
    os.makedirs(dir, 0o755)
  except OSError:
    pass
  with open(filename, "w") as f:
    f.write(content)

# kvm

def header(cluster, cluster_type, pub_key, priv_key):
  # geneate random token to join kubernetes
  kube_token = ''.join(random.choices(string.hexdigits[:16], k=32))
  with open(pub_key, "r") as f:
    ssh_authorized_key = f.read()
  with open(priv_key, "r") as f:
    b = f.read().encode()
    ssh_privkey_b64 = base64.b64encode(b).decode()
  return f"""[all:vars]
ansible_ssh_private_key_file={priv_key}
virt_dir={virt_dir}
image_url={params[cluster_type]['image_url']}
os_variant={params[cluster_type]['os_variant']}
base_image={params[cluster_type]['base_image']}
cluster_type={cluster_type}
ssh_authorized_key={ssh_authorized_key}
ssh_privkey_b64={ssh_privkey_b64}
kube_master={subnet}.10
kube_port={params[cluster_type]['kube_port']}
kube_token={kube_token}
kube_config={os.getcwd()}/kubeconfig/{cluster}/kubeconfig
"""

def inventory(cluster, server, count, disk, mem, cpu):
  hosts = "[server]\n"
  hosts += f"{server} cluster={cluster} subnet={subnet} subnet_mac={subnet_mac} nodes_count={count}\n"
  hosts += "\n[nodes]\n"
  for n in range(count):
    vcpu = 2 if n == 0 and cpu == 1 else cpu
    hosts += f"{subnet}.{10+n} id={n} hostname={cluster}{n} mac_addr={subnet_mac}:{10+n} disk_size={disk} mem_size={mem} vcpu_num={vcpu}\n"
  return hosts

# kvm
def kvm():
  parser = argparse.ArgumentParser("configure")
  parser.add_argument("name", help="name of cluster")
  parser.add_argument("cloud", help="cloud type")
  parser.add_argument("ktype", help="kube type", choices=["microk8s", "okd"])
  parser.add_argument("server", help="hostname of server")
  parser.add_argument("priv_key", help="private key file")
  parser.add_argument("pub_key", help="public key file")
  parser.add_argument("count", type=int, help="number of nodes")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  parser.add_argument("mem", type=int, help="memory size in gigabytes of each node")
  parser.add_argument("cpu", type=int, help="number of virtual cpu per node of each node")
  args = parser.parse_args()
  write_file(f"inventory/{args.name}.type", "kvm")
  write_file(f"inventory/{args.name}/hosts", 
    header(args.name, args.ktype, args.pub_key, args.priv_key) + inventory(args.name, args.server, args.count, args.disk, args.mem, args.cpu))

# aws
def aws():
  parser = argparse.ArgumentParser("configure")
  parser.add_argument("name", help="name of cluster")
  parser.add_argument("cloud", help="cloud type")
  parser.add_argument("key", help="aws key")
  parser.add_argument("secret", help="aws secret")
  parser.add_argument("region", help="aws region")
  parser.add_argument("type", help="worker instance type")
  parser.add_argument("count", type=int, help="number of workers")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  args = parser.parse_args()

  write_file(f"inventory/{args.name}.type", "aws")
  write_file(f"inventory/{args.name}/hosts", f"""[all:vars]
cluster={args.name}
aws_access_key={args.key}
aws_secret_key={args.secret}
region={args.region}
vpc={vpc}
instance_type={args.type}
count={args.count}
disk_size={args.disk}
""")

# okd
def okd():
  parser = argparse.ArgumentParser("configure")
  parser.add_argument("name", help="name of cluster")
  parser.add_argument("cloud", help="cloud type")
  parser.add_argument("server", help="hostname of server")
  parser.add_argument("priv_key", help="private key file")
  parser.add_argument("pub_key", help="public key file")
  parser.add_argument("count", type=int, help="number of nodes")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  parser.add_argument("mem", type=int, help="memory size in gigabytes of each node")
  parser.add_argument("cpu", type=int, help="number of virtual cpu per node of each node")
  args = parser.parse_args()

  write_file(f"inventory/{args.name}.type", "okd")
  write_file(f"inventory/{args.name}/hosts",
    header(args.name, "okd", args.pub_key, args.priv_key) + inventory(args.name, args.server, args.count, args.disk, args.mem, args.cpu))

# azure
def azure():
  parser = argparse.ArgumentParser("configure")
  parser.add_argument("name", help="name of cluster")
  parser.add_argument("cloud", help="cloud type")
  parser.add_argument("subscription", help="subscription id")
  parser.add_argument("tenant", help="tenant id")
  parser.add_argument("key", help="service pricipal client id")
  parser.add_argument("secret", help="service principal secret")
  parser.add_argument("region", help="azure region")
  parser.add_argument("type", help="worker instance type")
  parser.add_argument("count", type=int, help="number of workers")
  parser.add_argument("disk", type=int, help="disk size in gigabytes of each node")
  
  args = parser.parse_args()
  write_file(f"inventory/{args.name}.type", "azure")
  write_file(f"inventory/{args.name}/hosts", f"""[all:vars]
cluster={args.name}
subscription_id={args.subscription}
tenant={args.tenant}
client_id={args.key}
secret={args.secret}
region={args.region}
vnet={vpc}
instance_type={args.type}
count={args.count}
disk_size={args.disk}
kube_config={os.getcwd()}/kubeconfig/{args.name}/kubeconfig
""")
# main

def main():
    if len(sys.argv) > 2:
      if sys.argv[2] == "kvm":
        return kvm()
      if sys.argv[2] == "aws":
        return aws()
      if sys.argv[2] == "azure":
        return azure()            
      if sys.argv[2] == "okd":
        return okd()
    print("usage: <name> [kvm|aws|okd|azure] ... (use the subcommand for details) ") 

if __name__ == "__main__":
    main()
