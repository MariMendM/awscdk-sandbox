# CDK001

Based on [devops-sandbox's Project001 CloudFormation](https://github.com/MariMendM/devops-sandbox/blob/master/Project001/cloudformation.yml), this project creates exactly the same resources included in it, namely:
* VPC
* Internet Gateway
* Route Table for public traffic, with route to Internet Gateway
* Subnet public associtaed to Route Table

The `cdk.json` file includes parametrization to deploy CDK:
```json
	"ENVCONFIGS": {
  		"environment_name": "cdk001",
  		"cidr_vpc": "10.0.0.0/16",
  		"subnets": [
  		  { "cidr_subnet": "10.0.10.0/24", "ispublic": true },
  		  { "cidr_subnet": "10.0.20.0/24", "ispublic": true }
  		]
  	}
```

## Useful commands

 * `cdk deploy`      deploy this stack to default AWS account, region US-EAST-1
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
