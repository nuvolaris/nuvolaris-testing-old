# How to build a cluster

1. Get a remote server. You need at least 64gb of memory and 4 cores
2. generate a configuration running ./config.py, use ./config.py -h to see the parameters
3. copy the public and private key to access the server in `inventory/id_rsa` and `inventory/id_rsa.pub`
4. run `./play.sh <cluster>`
