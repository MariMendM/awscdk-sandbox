import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

//-------------------------------------------------------------------------------------------------
//Definition of content of each user of array 'Subnets', according to cdk.json
interface ISubnetSpecification
{
	cidr_subnet: string;
	ispublic: boolean;
}
//-------------------------------------------------------------------------------------------------
//StackProps extended to receive parameters from app
interface Cdk001StackProps extends cdk.StackProps
{
	EnvironmentName: string;
	CIDR_VPC: string;
	SubnetConfigs: Array<ISubnetSpecification>;
}
//-------------------------------------------------------------------------------------------------
export class Cdk001Stack extends cdk.Stack
{
	constructor(scope: cdk.App, id: string, props: Cdk001StackProps)
	{
		super(scope, id, props);

		//Creating VPC
		const resVPC = new ec2.CfnVPC(this, 'VPC',
			{	cidrBlock: props.CIDR_VPC,
				enableDnsHostnames: true,
				enableDnsSupport: true,
			}
		);

		//Creating Internet Gateway
		const resIGw = new ec2.CfnInternetGateway(this, 'InternetGateway');
		//Creating Internet Gateway attachment to VPC
		const resIGwVpcAttach = new ec2.CfnVPCGatewayAttachment(this, 'IGwVpcAttach',
			{	vpcId: resVPC.ref,
				internetGatewayId: resIGw.ref,
			}
		);
		resIGwVpcAttach.addDependsOn(resVPC);
		resIGwVpcAttach.addDependsOn(resIGw);

		//Creating Route Table for public traffic (for public subnets)
		const resRouteTablePublic = new ec2.CfnRouteTable(this, 'RouteTablePub', {vpcId: resVPC.ref});
		resRouteTablePublic.addDependsOn(resVPC);
		//Creating route for Internet Gateway
		const resRouteTablePublicRoute1 = new ec2.CfnRoute(this, 'RouteTablePubRoute1',
			{	routeTableId: resRouteTablePublic.ref,
				gatewayId: resIGw.ref,
				destinationCidrBlock: '0.0.0.0/0',
			}
		);
		resRouteTablePublicRoute1.addDependsOn(resRouteTablePublic);
		resRouteTablePublicRoute1.addDependsOn(resIGw);

		//Creating subnets according to cdk.json configuration specification
		let subnetCounter:number = 1;
		for (let subnetSpec of props.SubnetConfigs)
		{	
			const resSubnet = new ec2.CfnSubnet(this, 'Subnet' + subnetCounter,
				{	vpcId: resVPC.ref,
					cidrBlock: subnetSpec['cidr_subnet'],
					mapPublicIpOnLaunch: true,
					availabilityZone: cdk.Stack.of(this).availabilityZones[subnetCounter-1],
					tags: [
						{ key: "Name", value: props.EnvironmentName + "-pub" + subnetCounter, },
					],
				}
			);
			resSubnet.addDependsOn(resVPC);
		
			new ec2.CfnSubnetRouteTableAssociation(this, 'Subnet'+subnetCounter+'RouteTablePublicAssoc',
				{
					routeTableId: resRouteTablePublic.ref,
					subnetId: resSubnet.ref,
				}
			);
			
			subnetCounter++;
		}
	}

}