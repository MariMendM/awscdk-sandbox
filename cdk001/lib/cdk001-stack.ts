import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

//-------------------------------------------------------------------------------------------------
//Definition of content of each user of array 'Subnets', according to cdk.json
interface ISubnetSpecification
{
	cidr: string;
	ispublic: boolean;
}
//-------------------------------------------------------------------------------------------------
//StackProps extended to receive parameters from app
interface Cdk001StackProps extends cdk.StackProps
{
	EnvironmentName: string;
	CidrVPC: string;
	SubnetConfigs: Array<ISubnetSpecification>;
}
//-------------------------------------------------------------------------------------------------
export class Cdk001Stack extends cdk.Stack
{
	constructor(scope: cdk.App, id: string, props: Cdk001StackProps)
	{
		super(scope, id, props);

		//##################################################################################
		//Creating VPC...
		const resVPC = new ec2.CfnVPC(this, 'VPC',
			{	cidrBlock: props.CidrVPC,
				enableDnsHostnames: true,
				enableDnsSupport: true,
			}
		);

		//##################################################################################
		//Creating Internet Gateway...
		const resIGw = new ec2.CfnInternetGateway(this, 'InternetGateway');
		//... and Internet Gateway attachment to VPC
		const resIGwVpcAttach = new ec2.CfnVPCGatewayAttachment(this, 'InternetGatewayVpcAttach',
			{	vpcId: resVPC.ref,
				internetGatewayId: resIGw.ref,
			}
		);
		resIGwVpcAttach.addDependsOn(resVPC);
		resIGwVpcAttach.addDependsOn(resIGw);
		
		//##################################################################################
		//Creating Route Table for public traffic (for public subnets)...
		const resRouteTablePublic = new ec2.CfnRouteTable(this, 'RouteTablePub', {vpcId: resVPC.ref});
		resRouteTablePublic.addDependsOn(resVPC);
		//... and route in Route Table for Internet Gateway
		const resRouteTablePublicRoute1 = new ec2.CfnRoute(this, 'RouteTablePubRoute1',
			{	routeTableId: resRouteTablePublic.ref,
				gatewayId: resIGw.ref,
				destinationCidrBlock: '0.0.0.0/0',
			}
		);
		resRouteTablePublicRoute1.addDependsOn(resRouteTablePublic);
		resRouteTablePublicRoute1.addDependsOn(resIGw);

		//##################################################################################
		//Creating subnets according to cdk.json configuration specification
		let subnetCounter:number = 1;
		for (let subnetSpec of props.SubnetConfigs)
		{	
			let isSubnetPublic:boolean = subnetSpec['ispublic'];

			//Create subnet
			const resSubnet = new ec2.CfnSubnet(this, 'Subnet' + subnetCounter,
				{	vpcId: resVPC.ref,
					cidrBlock: subnetSpec['cidr'],
					mapPublicIpOnLaunch: isSubnetPublic,
					availabilityZone: cdk.Stack.of(this).availabilityZones[subnetCounter-1],
					tags: [
						{	key: "Name",
							value: props.EnvironmentName + (isSubnetPublic ? "-pub" : "-pvt") + subnetCounter
						},
					],
				}
			);
			resSubnet.addDependsOn(resVPC);

			//Configure subnet according to public/private definition...
			if (isSubnetPublic)
			{
				//Create association of public subnet to RouteTablePub
				new ec2.CfnSubnetRouteTableAssociation(this, 'Subnet'+subnetCounter+'RouteTableAssoc',
					{
						routeTableId: resRouteTablePublic.ref,
						subnetId: resSubnet.ref,
					}
				);
			}
			/*
			else
			{
				//Create NAT Gateway (and respective EIP) for private subnet...
				const resNatEIP = new ec2.EIP(this, 'NATGateway'+subnetCounter+'EIP', { domain: resVPC.ref });
				resNatEIP.addDependsOn(resVPC);
				
				const resNATGw = new ec2.CfnNatGateway(this, 'NATGateway'+subnetCounter,
					{	allocationId: resNatEIP.ref,
						subnetId: resSubnet.ref, //HOWTO? choose a public subnet!!!!!!
					}
				);
				resIGwVpcAttach.addDependsOn(resNatEIP);
				resIGwVpcAttach.addDependsOn(resSubnet);
				
				//Creating Route Table for private traffic (one RT for each private subnet)...
				const resRouteTablePrivate = new ec2.CfnRouteTable(this, 'RouteTablePvt'+subnetCounter, {vpcId: resVPC.ref});
				resRouteTablePrivate.addDependsOn(resVPC);
				//... and route in Route Table for NAT Gateway
				const resRouteTablePrivateRoute = new ec2.CfnRoute(this, 'RouteTablePvtRoute'+subnetCounter,
					{	routeTableId: resRouteTablePrivate.ref,
						gatewayId: resNATGw.ref,
						destinationCidrBlock: props.CidrVPC,
					}
				);
				resRouteTablePrivateRoute.addDependsOn(resRouteTablePrivate);
				resRouteTablePrivateRoute.addDependsOn(resNATGw);
				
				//Create association of private subnet to RouteTablePvt
				new ec2.CfnSubnetRouteTableAssociation(this, 'Subnet'+subnetCounter+'RouteTableAssoc',
					{
						routeTableId: resRouteTablePrivate.ref,
						subnetId: resSubnet.ref,
					}
				);
			}
			*/
			
			subnetCounter++;
		}
	}

}