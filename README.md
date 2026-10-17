# AWS CDK Sandbox Projects

Sandbox for demos of AWS CDK, but most of the projects will also have the respective manually created CloudFormation included, for reference and for testing AWS services without the need of CDK.  

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

**Services:** VPC (Subnet...) :black_small_square: ...

**Constructs:** CfnVPC :black_small_square: CfnSubnets :black_small_square: ...

---

## CDK002
[![Generic badge](https://img.shields.io/badge/Status-Fixing_CDK,_CFN_ok-red.svg)](https://shields.io/)

**Purpose:** Create a stack deploying a private S3 bucket and some IAM users configured to access it according to user policy chosen for each. CyberDuck can also be used, configured with protocol Amazon S3. (documentation [here](cdk002/README.md)).

**Services:** S3 :black_small_square: IAM (ManagedPolicy, PolicyStatement, Group, User, AccessKey)

**Constructs:** @aws-cdk/aws-s3 (Bucket) :black_small_square: @aws-cdk/aws-iam (ManagedPolicy, PolicyStatement, Group, User, CfnAccessKey) :black_small_square: @aws-cdk/core (CfnOutput)

---

## CDK003
[![Generic badge](https://img.shields.io/badge/Status-InWork-lavender.svg)](https://shields.io/)

**Purpose:** Create a stack deploying a CodePipeline to build a docker image with a C++ REST API and push it into ECR, deploying it to ECS. (documentation [here](cdk003/README.md)).

**Services:** CodePipeline / CodeBuild / CodeDeploy :black_small_square: S3 :black_small_square: ECR :black_small_square: IAM (Role)

**Constructs:** ...
