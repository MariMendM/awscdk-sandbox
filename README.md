# AWS CDK Sandbox Projects

Sandbox for demos of AWS CDK.

---

## CDK001
[![Generic badge](https://img.shields.io/badge/Status-InWork-yellow.svg)](https://shields.io/)

**Purpose:** Create stack with VPC, some subnets and gateways required for proper routing (documentation [here](cdk001/README.md)).

<details><summary>Diagram (pending)</summary><img src="cdk001/documents/diagram.png"></details>

**Constructs:** CfnVPC :black_small_square: CfnSubnets :black_small_square: ...

---

## CDK002
[![Generic badge](https://img.shields.io/badge/Status-Finished-green.svg)](https://shields.io/)

**Purpose:** Create stack deploying a S3 buckets and some users to be accessed by FTP (documentation [here](cdk002/README.md)).

**Constructs:** @aws-cdk/aws-s3 (Bucket) :black_small_square: @aws-cdk/aws-iam (ManagedPolicy, PolicyStatement, Group, User, CfnAccessKey) :black_small_square: @aws-cdk/core (CfnOutput)
