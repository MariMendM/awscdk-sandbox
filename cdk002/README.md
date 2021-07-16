# CDK Typescript for FTP environment to S3

Based on [cfn-reference-template.yml](cfn-reference-template.yml) that was manually created for CloudFormation, this project creates exactly the same resources included in it, namely:
* 1 S3 Bucket (private), with versioning enabled according to cdk.json parameter 'enable_s3_versioning'
* 1 Full access Policy to S3 Bucket
* 1 Read only Policy to S3 Bucket
* 1 IAM Group with full access policy attached
* 1 IAM Group with read only policy attached
* As many users as configured in cdk.jon array parameter 'iam_users'

The `cdk.json` file includes parametrization to deploy CDK:
```json
	"ENVCONFIGS": {
		"PRD": {
			"environment_name": "beer-store",
			"enable_s3_versioning": false,
			"iam_users": [
				{ "name": "mari", "permission": "FA", "console": true, "programmatic": true },
				{ "name": "joao", "permission": "RO", "console": false, "programmatic": true },
				{ "name": "tete", "permission": "RO", "console": true, "programmatic": false }
			]
		},
		"DEV": {
			"environment_name": "teste",
			"enable_s3_versioning": false,
			"iam_users": [
				{ "name": "mari", "permission": "FA", "console": true, "programmatic": true }
			]
		}
	}
```

For array 'iam_users', each set defines an user, where:
* 'name' defines the IAM user name;
* 'permission' defines the access in S3 bucket ('RO' for ReadOnly, or 'FA' for FullAccess);
* 'console' defines whether the user has access to login in console or not; and
* 'programmatic' defines if the user has Secret Key created for access using CLI or SDK.

The region of deploy of stack is currently hard-coded inside bin/cdk002.ts as 'us-east-1'.

## Useful commands

In all commands, OPTION must be either PRD or DEV.

 * `cdk deploy -c envType=OPTION`      deploy this stack to default AWS account
 * `cdk diff -c envType=OPTION`        compare deployed stack with current state
 * `cdk synth -c envType=OPTION`       emits the synthesized CloudFormation template

To export CloudFormation Outputs to file, use the command:

 * `cdk deploy -c envType=OPTION --outputs-file ./cdk-outputs.json`