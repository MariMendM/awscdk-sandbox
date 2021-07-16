#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Cdk002Stack } from '../lib/cdk002-stack';

const app = new cdk.App();

//-------------------------------------------------------------------------------------------------
//Checking parameter '-c' for 'envType' specification
//-------------------------------------------------------------------------------------------------
//Ex.: cdk diff -c envType=PRD
//Ex.: cdk deploy -c envType=DEV
//-------------------------------------------------------------------------------------------------
var envType = app.node.tryGetContext('envType');
if (!envType)
	throw new Error("CDK command shall specify 'envType' using '-c envType=DEV|PRD'")
if (envType != "PRD" && envType != "DEV")
	throw new Error("CDK command specified invalid 'envType'. Use one of the options '-c envType=DEV|PRD'")

//-------------------------------------------------------------------------------------------------
//Reading ENVCONFIGS of 'cdk.json'
//-------------------------------------------------------------------------------------------------
let jsonConfig = app.node.tryGetContext('ENVCONFIGS');

const regexpEnvName = new RegExp('^((?:[0-9a-z-])+)');
if ( !regexpEnvName.test(jsonConfig[envType]['environment_name']) )
	throw new Error("Config 'environment_name' of cdk.json must be lowercase, alphanumeric and hyphens, not empty, no spaces!");

//-------------------------------------------------------------------------------------------------
//Tagging all resources from app
//-------------------------------------------------------------------------------------------------
cdk.Tags.of(app).add('EnvType', envType);
cdk.Tags.of(app).add('Name', jsonConfig[envType]['environment_name']);


//-------------------------------------------------------------------------------------------------
new Cdk002Stack(app, 'Cdk002Stack',
	{	/* If you don't specify 'env', this stack will be environment-agnostic.
		   Account/Region-dependent features and context lookups will not work, but a single synthesized
		   template can be deployed anywhere. */

		/* Uncomment the next line to specialize this stack for the AWS Account and Region that are
		   implied by the current CLI configuration. */
		// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

		/* Uncomment the next line if you know exactly what Account and Region you want to deploy the stack to. */
		// env: { account: '123456789012', region: 'us-east-1' },

		/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
		
		env: { region: 'us-east-1' },
		EnvironmentName: jsonConfig[envType]['environment_name'],
		EnableS3Versioning: jsonConfig[envType]['enable_s3_versioning'],
		IamUsers: jsonConfig[envType]['iam_users'],
	}
);