#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Cdk001Stack } from '../lib/cdk001-stack';

const app = new cdk.App();

//-------------------------------------------------------------------------------------------------
//Reading ENVCONFIGS of 'cdk.json'
//-------------------------------------------------------------------------------------------------
let jsonConfig = app.node.tryGetContext('ENVCONFIGS');

//Checking 'environment_name' for regular expression
const regexpEnvName = new RegExp('^((?:[0-9a-z-])+)');
if ( !regexpEnvName.test(jsonConfig['environment_name']) )
	throw new Error("Config 'environment_name' of cdk.json must be lowercase, alphanumeric and hyphens, not empty, no spaces!");

//-------------------------------------------------------------------------------------------------
//Tagging all resources from app
//-------------------------------------------------------------------------------------------------
cdk.Tags.of(app).add('Name', jsonConfig['environment_name']);


//-------------------------------------------------------------------------------------------------
new Cdk001Stack(app, 'Cdk001Stack',
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
		EnvironmentName: jsonConfig['environment_name'],
		CIDR_VPC: jsonConfig['cidr_vpc'],
		SubnetConfigs: jsonConfig['subnets'],
	}
);