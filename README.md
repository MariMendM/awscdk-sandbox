# AWS Sandbox Projects

This repo started as a sandbox for demos of AWS CDK, but it turn out to be simply a sandbox for AWS services and integrations. All projects will have a CloudFormation template to deploy the proposed stacks, but only some will also have the respective CDK included (the ones that have a "Constructs" description).

<!--How to use badges?

The static badge accepts a single required path parameter which encodes either:
- Label grey (any text), message (you like) and color of the message, all separated by a dash
  Example: https://img.shields.io/badge/any_text-you_like-blue
- Message (just the message) and color of the message, separated by a dash
  Example: https://img.shields.io/badge/just_the_message-8A2BE2
- Colors can be names (yellow, green...) or codes (8A2BE2...)
-->

---

## CDK001
[![Generic badge](https://img.shields.io/badge/Status-PendingDoc-yellow.svg)](https://shields.io/)

**Purpose:** Create a stack with VPC, some subnets and gateways required for proper routing (documentation [here](cdk001/README.md)).

<details><summary>Diagram (pending)</summary><img src="cdk001/documents/diagram.png"></details>

**Services:** VPC (Subnets, Route Tables, NACLs, Internet Gateway)

**Constructs:** @aws-cdk/core :black_small_square: @aws-cdk/aws-ec2

---

## CDK002
[![Generic badge](https://img.shields.io/badge/Status-Fixing_CDK,_CFN_ok-red.svg)](https://shields.io/)

**Purpose:** Create a stack deploying a private S3 bucket and some IAM users configured to access it according to user policy chosen for each. CyberDuck can also be used, configured with protocol Amazon S3. (documentation [here](cdk002/README.md)).

**Services:** S3 :black_small_square: IAM (ManagedPolicy, PolicyStatement, Group, User, AccessKey)

**Constructs:** @aws-cdk/core (CfnOutput) :black_small_square: @aws-cdk/aws-s3 (Bucket) :black_small_square: @aws-cdk/aws-iam (ManagedPolicy, PolicyStatement, Group, User, CfnAccessKey)

---

## CDK003
[![Generic badge](https://img.shields.io/badge/Status-Finished-green.svg)](https://shields.io/)

**Purpose:** Create a stack deploying a CodePipeline to build a docker image with a C++ REST API and push it into ECR, deploying it to a private ECS. (documentation [here](cdk003/README.md)).

<details><summary>Diagram (pending)</summary><img src="cdk003/documents/diagram.png"></details>

**Services:** CodePipeline (Code source from S3 + CodeBuild + Deploy arget to ECS) :black_small_square: S3 (Bucket, PolicyBucket) :black_small_square: ECR :black_small_square: ECS (Cluster, Service, Task Definition) :black_small_square: ELB (Application Balancer, Listener, Target Group) :black_small_square: EventBridge (Rule) :black_small_square: CloudTrail (Trail) :black_small_square: VPC (Subnets, Route Tables, NACLs, SGs, Internet Gateway, NAT Gateway) :black_small_square: IAM (Roles, Policies) :black_small_square: Docker (dockerfile)
