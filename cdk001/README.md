# CDK001

This project creates following architecture:
* 1 VPC
* 1 Internet Gateway
* As many public Subnetsas described in 'subnets' array of cdk.json configuration
* 1 Route Table for public traffic, with route to Internet Gateway and associated to public subnets
* As many private Subnets as described in 'subnets' array of cdk.json configuration
* 1 NAT Gateways (and respective EIP) for each private subnet
* 1 Route Table for each private subnet, with route to respective NAT Gateway and associated to respective private subnet

The `cdk.json` file includes parametrization to deploy CDK:
```json
	"ENVCONFIGS": {
  		"environment_name": "cdk001",
  		"cidr_vpc": "10.0.0.0/16",
  		"subnets": [
  		  { "cidr": "10.0.10.0/24", "ispublic": true },
  		  { "cidr": "10.0.20.0/24", "ispublic": true }
  		]
  	}
```

## Useful commands

 * `cdk deploy`      deploy this stack to default AWS account, region US-EAST-1
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
