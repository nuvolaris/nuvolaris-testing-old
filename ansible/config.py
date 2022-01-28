#!/usr/bin/env python

import sys
import socket
import argparse
import os.path

subnet = "10.0.0"
subnet_mac = "52:54:10:00:00"

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
  print("cluster", args.cluster)
  print("server", args.server)
  print("count", args.count)

  write_file(f"inventory/{args.cluster}/hosts", 
    inventory(args.cluster, args.server, args.count, args.disk, args.mem, args.cpu))
