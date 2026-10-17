# CDK Typescript: creation of IAM users to access S3

Description: This CDK creates a private S3 bucket and a set of IAM users configured to access it according to user policy (read-only of full-access). CyberDuck with protocol Amazon S3 is used to test the accesses. The same stack can be created by uploading the [cfn-reference-template.yml](cfn-reference-template.yml) into CloudFormation console.

Both the CDK and the CloudFormation template provision the same set of resources, namely:
* 1 S3 Bucket (private), with versioning enabled according to cdk.json parameter 'enable_s3_versioning' (EnableS3Versioning variable in template)
* 1 IAM Full-access Policy to the S3 Bucket
* 1 IAM Read-only Policy to the S3 Bucket
* 1 IAM ListAllBuckets Policy in S3
* 1 IAM Group with Full-access + ListAllBuckets policies attached
* 1 IAM Group with Read-only + ListAllBuckets policies attached
* As many users as configured in cdk.jon array parameter 'iam_users'

The `cdk.json` file includes parametrization to deploy CDK:
```json
	"ENVCONFIGS": {
		"PRD": {
			"environment_name": "test",
			"enable_s3_versioning": false,
			"iam_users": [
				{ "name": "grogu", "permission": "FA", "console": true, "programmatic": true },
				{ "name": "mando", "permission": "RO", "console": false, "programmatic": true },
				{ "name": "kryze", "permission": "RO", "console": true, "programmatic": false }
			]
		},
		"DEV": {
			"environment_name": "teste",
			"enable_s3_versioning": false,
			"iam_users": [
				{ "name": "karga", "permission": "FA", "console": true, "programmatic": true }
			]
		}
	}
```

For array 'iam_users', each set defines an user, where:
* 'name' defines the IAM user name;
* 'permission' defines the access in S3 bucket ('RO' for ReadOnly, or 'FA' for FullAccess);
* 'console' defines whether the user has access to login in console or not; and
* 'programmatic' defines if the user has Secret Key created for access using CLI or SDK (which is also the case to access the bucket via CyberDuck).

The region of deploy of stack is currently hard-coded inside bin/cdk002.ts as 'us-east-1'.

## Useful CDK commands

In all commands, OPTION must be either PRD or DEV.

 * `cdk deploy -c envType=OPTION`      deploy this stack to default AWS account
 * `cdk diff -c envType=OPTION`        compare deployed stack with current state
 * `cdk synth -c envType=OPTION`       emits the synthesized CloudFormation template

To export CloudFormation Outputs to file, use the command:

 * `cdk deploy -c envType=OPTION --outputs-file ./cdk-outputs.json`

## Testing

Open Cyberduck, open a connection using 'Amazon S3' protocol, port 443, and use created users Access Key ID/Secret. They all required by the SigV4 used for the handshake of the secure connection behind the scenes.
For the users with console access, log in via AWS console. A password change will be required.

To troubleshoot log in for those users, access CloudTrail and search for events related (like Event Name = ConsoleLogin). Important to note that CloudTrail login events are not necessarily logged in the same region of the users attempting to login.