#!/bin/bash
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

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "eu-south-1"
}



module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-south-1a", "eu-south-1b", "eu-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = true

  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}



data "aws_eks_cluster" "eks" {
  name = module.eks.cluster_id
}

data "aws_eks_cluster_auth" "eks" {
  name = module.eks.cluster_id
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.eks.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.eks.token
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"

  cluster_version = "1.21"
  cluster_name    = "my-cluster"
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.private_subnets

  worker_groups = [
    {
      instance_type = "t3.medium"
      asg_max_size  = 2
    }
  ]

  depends_on = [module.vpc]
}



# module "stop_ec2_instance" {
#   source                         = "diodonfrost/lambda-scheduler-stop-start/aws"
#   name                           = "ec2_stop"
#   cloudwatch_schedule_expression = "cron(0 20 ? * MON-FRI *)"
#   schedule_action                = "stop"
#   autoscaling_schedule           = "false"
#   ec2_schedule                   = "true"
#   rds_schedule                   = "false"
#   cloudwatch_alarm_schedule      = "false"
#   scheduler_tag                  = {
#     key   = "tostop"
#     value = "true"
#   }
# }

# module "start_ec2_instance" {
#   source                         = "diodonfrost/lambda-scheduler-stop-start/aws"
#   name                           = "ec2_start"
#   cloudwatch_schedule_expression = "cron(0 6 ? * MON-FRI *)"
#   schedule_action                = "start"
#   autoscaling_schedule           = "false"
#   ec2_schedule                   = "true"
#   rds_schedule                   = "false"
#   cloudwatch_alarm_schedule      = "false"
#   scheduler_tag                  = {
#     key   = "tostop"
#     value = "true"
#   }
# }