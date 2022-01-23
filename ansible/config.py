#!/usr/bin/env python

import sys
import socket
import argparse
import os.path

def host2entry(host):
    return f"{host} name={host}"

def inventory(server):
  hosts = "[server]\n"
  hosts += host2entry(server)
  #hosts += "[nodes]\n"
  #for host in nodes[1:]:
  #  hosts += host2entry(host)
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
  parser.add_argument("cluster", help="<cluster>")
  parser.add_argument("server", help="<hostname>")
  args = parser.parse_args()
  print("cluster", args.cluster)
  print("server", args.server)
  write_file(f"inventory/{args.cluster}/hosts", inventory(args.server))
