#!/bin/bash


regions=( "us-east-1" "us-east-2" "us-west-1" "us-west-2" "ca-central-1" "eu-west-1" "eu-west-2" "eu-west-3" "eu-central-1" "ap-south-1" "ap-east-1" "ap-northeast-2" "ap-southeast-1" "ap-southeast-2" "ap-northeast-1" "me-south-1" "sa-east-1" )
for region in "${regions[@]}"
do
  echo "Running artillery in $region"
  artillery run-fargate --region $region --spot ./artillery.yaml &
done

wait