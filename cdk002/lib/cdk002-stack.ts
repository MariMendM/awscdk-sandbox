import * as cdk from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import * as IAM from '@aws-cdk/aws-iam';


//-------------------------------------------------------------------------------------------------
//Definition of content of each user of array IamUsers, according to cdk.json
interface IIamUserSpecification 
{
	name: string;
	permission: string;
	console: boolean;
	programmatic: boolean;
}
//-------------------------------------------------------------------------------------------------
//StackProps extended to receive parameters from app
interface Cdk002StackProps extends cdk.StackProps
{
	EnvironmentName: string;
	EnableS3Versioning: boolean;
	IamUsers: Array<IIamUserSpecification>;
}
//-------------------------------------------------------------------------------------------------
export class Cdk002Stack extends cdk.Stack
{
	constructor(scope: cdk.Construct, id: string, props: Cdk002StackProps)
	{
		super(scope, id, props);

		//##################################################################################
		// S3 ##############################################################################
		const resS3Bucket = new S3.Bucket(this, 'S3Bucket',
			{	bucketName: props.EnvironmentName + "-bucket-docs",
				blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
				publicReadAccess: false,
				versioned: props.EnableS3Versioning,
				removalPolicy: cdk.RemovalPolicy.RETAIN,
				/*
				lifecycleRules:
					[	{	expiration: Duration.days(365),
							transitions:
								[	{	storageClass: StorageClass.GLACIER,
										transitionAfter: Duration.days(90)
									}
								]
						}
					],
				*/
			}
		);

		//##################################################################################
		// Policies for group management ###################################################

		// ReadOnly in S3bucket
		const resIAMPolicyS3bucketReadOnly = new IAM.ManagedPolicy(this, 'IAMPolicyS3bucketReadOnly',
			{	managedPolicyName: props.EnvironmentName + "-bucket-docs" + ".ReadOnly",
				description: "Read Only access to bucket" + props.EnvironmentName + "-bucket-docs",
				path: "/" + props.EnvironmentName + "/policies/",
				statements:
					[	new IAM.PolicyStatement(
							{	effect: IAM.Effect.ALLOW,
								actions: ['s3:List*', 's3:Get*'],
								resources:
									['arn:aws:s3:::' + props.EnvironmentName + '-bucket-docs',
									 'arn:aws:s3:::' + props.EnvironmentName + '-bucket-docs/*'],
							}
						)
					],
			}
		);

		// FullAccess in S3bucket
		const resIAMPolicyS3bucketFullAccess = new IAM.ManagedPolicy(this, 'IAMPolicyS3bucketFullAccess',
			{	managedPolicyName: props.EnvironmentName + "-bucket-docs" + ".FullAccess",
				description: "Read Only access to bucket" + props.EnvironmentName + "-bucket-docs",
				path: "/" + props.EnvironmentName + "/policies/",
				statements:
					[	new IAM.PolicyStatement(
							{	effect: IAM.Effect.ALLOW,
								actions: ['s3:*'],
								resources:
									['arn:aws:s3:::' + props.EnvironmentName + '-bucket-docs',
									 'arn:aws:s3:::' + props.EnvironmentName + '-bucket-docs/*'],
							}
						)
					],
			}
		);

		// ListAllMyBuckets access in S3 service for FTP
		const resIAMPolicyS3FTP = new IAM.ManagedPolicy(this, 'IAMPolicyS3FTP',
			{	managedPolicyName: props.EnvironmentName + ".ListAllBuckets",
				description: "ListAllMyBuckets for FTP listing protocols",
				path: "/" + props.EnvironmentName + "/policies/",
				statements:
					[	new IAM.PolicyStatement(
							{	effect: IAM.Effect.ALLOW,
								actions: ['s3:ListAllMyBuckets'],
								resources: ['*'],
							}
						)
					],
			}
		);

		//##################################################################################
		// IAM Groups using policies #######################################################

		//Group S3 Read Only
		const resIAMGroupS3ReadOnly = new IAM.Group(this, 'IAMGroupS3ReadOnly',
			{	groupName: props.EnvironmentName + "-bucket-docs" + ".ReadOnly",
				path: "/" + props.EnvironmentName + "/groups/",
			}
		);
		resIAMGroupS3ReadOnly.addManagedPolicy(resIAMPolicyS3bucketReadOnly);
		resIAMGroupS3ReadOnly.addManagedPolicy(resIAMPolicyS3FTP);

		//Group S3 Full Access
		const resIAMGroupS3FullAccess = new IAM.Group(this, 'IAMGroupS3FullAccess',
			{	groupName: props.EnvironmentName + "-bucket-docs" + ".FullAccess",
				path: "/" + props.EnvironmentName + "/groups/",
			}
		);
		resIAMGroupS3FullAccess.addManagedPolicy(resIAMPolicyS3bucketFullAccess);
		resIAMGroupS3FullAccess.addManagedPolicy(resIAMPolicyS3FTP);

		//##################################################################################
		// IAM Users attached to groups ####################################################
		
		let userCounter:number = 1;
		for (let userSpec of props.IamUsers)
		{
			//Creates user with login profile for user, if specified true to console access; creates it without login profile otherwise
			let resIAMUser;
			if (userSpec['console'])
			{
				resIAMUser = new IAM.User(this, 'IAMUser' + userCounter,
					{	userName: userSpec['name'],
						//For simplicity, keeping standard path to use standard IAMUserChangePassword
						//Otherwise, IAMUserChangePassword should be replicated and have resource changed to "arn:aws:iam::*:user/*/${aws:username}"
						path: '/',
						password: cdk.SecretValue.plainText(props.EnvironmentName + '-Temp123'),
						passwordResetRequired: true,
						managedPolicies: [IAM.ManagedPolicy.fromAwsManagedPolicyName('IAMUserChangePassword')],
					}
				);
			}
			else
			{
				resIAMUser = new IAM.User(this, 'IAMUser' + userCounter,
					{	userName: userSpec['name'],
						path: '/',
					}
				);
			}

			//Defines to which group it belongs
			if (userSpec['permission'] == "RO")
				resIAMUser.addToGroup(resIAMGroupS3ReadOnly);
			else
				resIAMUser.addToGroup(resIAMGroupS3FullAccess);

			//Creates access key for user, if specified true to programmatic access
			if (userSpec['programmatic'])
			{
				const resAccessKey = new IAM.CfnAccessKey(this, 'AccessKeyForUser' + userCounter,
					{	userName: resIAMUser.userName,
					}
				);

				//Ideal solution to store user's access key ID and secret access key, where each user can access only its own AW Manager Secret
				//For this solution, all user shall have 'console' set to true in cdk.json
				//IMPORTANT: NOT YET TESTED
				/*
				const resSSMSecretKey = new ssm.StringParameter(this, 'SSMSecretKey' + userCounter,
					{	parameterName: '/' + [this.account, this.stackName, resIAMUser.userName, resAccessKey.ref].join('/'),
						stringValue: resAccessKey.attrSecretAccessKey,
					}
				);
				resIAMUser.addManagedPolicy(
					new IAM.ManagedPolicy(this, 'InlinePolicySSMForUser' + userCounter,
						{	statements:
								[	new IAM.PolicyStatement(
										{	effect: IAM.Effect.ALLOW,
											actions: ['*'], //["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:ListSecrets"],
											resources: [ ['arn:aws:secretsmanager', this.region, this.account, 'secret', resSSMSecretKey].join(':') ],
										}
									)
								],
						}
					)
				); */

				//Alternative of no cost to store user's access key ID and secret access key
				new cdk.CfnOutput(this, 'User' + userCounter,
					{	description: "UserName;AccessKeyID;SecretAccessKey",
						value: [resIAMUser.userName, resAccessKey.ref, resAccessKey.attrSecretAccessKey].join(';'),
					}
				);
			}
			
			userCounter++;
		}

	}
}
