#!/bin/sh
export AZURE_SUBSCRIPTION_ID=b55a224d-0399-4174-ade3-b964db5d4307
export AZURE_CLIENT_ID=a02cae5e-38d4-4b1b-a897-e2a274286cbf
export AZURE_SECRET=lJfT-CLKED2cO5bz~HeghF_3VD8SctH5ri
export AZURE_TENANT=c4c8f66e-a35a-458c-8e17-2739df9a2e06

ansible-playbook ./ansible/create-azure-win10-vm.yml
ansible-playbook -i ansible/azure_rm.yml ./ansible/install-docker-desktop.yml
#ansible-playbook -i ansible/azure_rm.yml ./ansible/test-nuv.yml